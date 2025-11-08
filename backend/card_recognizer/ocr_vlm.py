import os
import json
import torch
from PIL import Image
from typing import Dict, Any, Optional
from unsloth import FastVisionModel
from transformers import TextStreamer

class OCRService:
    def __init__(self, model_id: str = "unsloth/Llama-3.2-11B-Vision-Instruct-bnb-4bit"):
        """Initialize OCR service with model configuration"""
        self.model_id = model_id
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.tokenizer = None
        
    def load_model(self, lora_model_path: str) -> None:
        """Load and configure the model"""
        # Load base model
        self.model, self.tokenizer = FastVisionModel.from_pretrained(
            self.model_id,
            load_in_4bit=True,
            use_gradient_checkpointing="unsloth",
        )
        
        # Configure PEFT/LoRA settings
        self.model = FastVisionModel.get_peft_model(
            self.model,
            finetune_vision_layers=True,
            finetune_language_layers=True, 
            finetune_attention_modules=True,
            finetune_mlp_modules=True,
            r=16,
            lora_alpha=16,
            lora_dropout=0.05,
            bias="none",
            random_state=42,
        )
        
        # Load trained adapter
        self.model.load_adapter(lora_model_path, adapter_name="default")
        FastVisionModel.for_inference(self.model)
        
    def extract_card_info(self, image_path: str) -> Dict[str, Any]:
        """Extract card information from image"""
        if not self.model or not self.tokenizer:
            raise RuntimeError("Model not loaded. Call load_model() first.")
            
        # Prepare input
        instruction = "You are an OCR expert specialized in Pokémon cards. Extract the card name and card number in JSON format."
        messages = [
            {"role": "user", "content": [
                {"type": "image"},
                {"type": "text", "text": instruction}
            ]}
        ]
        
        input_text = self.tokenizer.apply_chat_template(
            messages, 
            add_generation_prompt=True
        )
        
        inputs = self.tokenizer(
            image_path,
            input_text,
            add_special_tokens=False,
            return_tensors="pt",
        ).to(self.device)
        
        # Generate output
        text_streamer = TextStreamer(self.tokenizer, skip_prompt=True)
        outputs = self.model.generate(
            **inputs,
            streamer=text_streamer,
            max_new_tokens=256,
            temperature=0.7,
            top_p=0.9,
            use_cache=True,
        )
        
        # Parse and return result
        result = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        try:
            # Attempt to parse JSON from model output
            return json.loads(result)
        except json.JSONDecodeError:
            return {
                "error": "Could not parse JSON from model output",
                "raw_output": result
            }
            
    def __call__(self, image_path: str) -> Dict[str, Any]:
        """Convenience method to call extract_card_info directly"""
        return self.extract_card_info(image_path)

def main():
    # Initialize service
    ocr_service = OCRService()
    
    # Load model
    lora_model_path = "backend/card_recognizer/vlm_model/content/lora_pokemon_model"
    ocr_service.load_model(lora_model_path)
    
    # Example usage
    image_path = "https://images.pokemontcg.io/zsv10pt5/140_hires.png"
    result = ocr_service(image_path)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()