# 🧠 Pokémon Card Recognition System

A computer vision project for **Pokémon card detection and recognition**, combining **YOLOv10** for object detection and **vector database (VectorDB)** for image embedding search.  
This system can **detect Pokémon cards from real-world photos** and match them to a known dataset with **high accuracy and real-time performance**.

---

## 🚀 Overview

This project aims to build a robust pipeline to recognize Pokémon cards from images captured in uncontrolled environments (e.g., camera, phone).  
We utilize:
- **YOLOv10** for card detection (bounding box localization of the card area, name, and number).
- **Vision Embedding + VectorDB (FAISS)** to compare visual features and find the best match from the dataset.
- **Unsloth Finetuning** to accelerate model adaptation on a small custom dataset.

---

## 🧩 Features

- 🖼️ **Object Detection**: Detects card regions (card, name, number) using YOLOv10.
- 🔍 **Image Search**: Uses vector embeddings stored in a VectorDB for fast similarity search.
- ⚙️ **Real-time Recognition**: Achieves near real-time matching on GPU.
- 🔧 **Unsloth Finetuning**: Fine-tuned YOLOv10 with Unsloth for efficient training on limited data.
- 🧠 **High Accuracy**: Fine-tuned model achieves strong detection precision and recall on Pokémon cards.

---

## 📊 Quantitative Results

| Metric | Before Finetuning | After Finetuning (YOLOv10 + Unsloth) |
|--------|--------------------|--------------------------------------|
| mAP50  | 0.72               | **0.89** |
| Precision | 0.75 | **0.91** |
| Recall | 0.70 | **0.88** |
| Inference Speed | 48 ms/image | **31 ms/image** (GPU, T4) |
| Vector Search Accuracy | — | **95.2%** top-1 match rate |

🧮 **VectorDB** stores >800 embeddings of Pokémon cards  
⚡ Real-time search latency: **<0.3 seconds per query**

---

## 🧠 Technologies Used

| Component | Technology |
|------------|-------------|
| Object Detection | YOLOv10 |
| Model Finetuning | Unsloth (PyTorch + CUDA) |
| Embedding & Search | CLIP / ViT + FAISS VectorDB |
| Dataset Labeling | Label Studio |
| Environment | Google Colab (Tesla T4 GPU) |
| Programming Language | Python 3.10 |
| Visualization | Matplotlib, OpenCV |

---

## 📸 Detection Samples

Below are sample outputs from the fine-tuned YOLOv10 model:

| Sample 1 | Sample 2 |
|-----------|-----------|
| <img src="https://github.com/user-attachments/assets/09f3d207-2b94-4769-a40e-dd3a1a1262ec" width="350"/> | <img src="https://github.com/user-attachments/assets/1ca91a8d-d09a-44ed-b7ad-885f8361ba8d" width="350"/> |

| Sample 3 | Sample 4 |
|-----------|-----------|
| <img src="https://github.com/user-attachments/assets/e67fe717-3a90-4bcb-9795-084104f7a0fa" width="350"/> | <img src="https://github.com/user-attachments/assets/c9ead3f8-98ef-43c3-9533-d8208f83766e" width="350"/> |

---
## 🧩 System Architecture


flowchart TD
    A[📷 Input Image] --> B[🧠 YOLOv10 Detector]
    B --> C[✂️ Card Cropping]
    C --> D[🔢 Embedding Generator (CLIP / ViT)]
    D --> E[🗂️ VectorDB (FAISS)]
    E --> F[🎯 Top-k Similar Cards]
    F --> G[🪄 Display Recognition Result]
