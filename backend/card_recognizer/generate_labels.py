import os
import json
import cv2
import random
import numpy as np
from tqdm import tqdm

# ========================
# CẤU HÌNH
# ========================
DATA_ROOT = r'D:\Pokemon\backend\script_db\temp_card'
TEMPLATE_PATH = r'D:\Pokemon\backend\card_recognizer\layout_templates.json'
OUTPUT_DIR = r'D:\Pokemon\backend\card_recognizer\yolo_dataset'
IMG_SIZE = 640
TRAIN_RATIO = 0.8
CLASSES = ['name', 'card_number']

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def letterbox_resize(image, target_size=640):
    h, w = image.shape[:2]
    scale = min(target_size / w, target_size / h)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    top = (target_size - new_h) // 2
    bottom = target_size - new_h - top
    left = (target_size - new_w) // 2
    right = target_size - new_w - left
    padded = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114))
    return padded, scale, left, top

def convert_to_yolo(box, img_w, img_h):
    x, y, w, h = box
    x_center = (x + w / 2) / img_w
    y_center = (y + h / 2) / img_h
    bw = w / img_w
    bh = h / img_h
    return x_center, y_center, bw, bh

def augment_image(image):
    aug_img = image.copy()
    choice = random.choice(['blur', 'bright', 'dark', 'contrast', 'none'])
    if choice == 'blur':
        k = random.choice([3, 5])
        aug_img = cv2.GaussianBlur(aug_img, (k, k), 0)
    elif choice == 'bright':
        aug_img = cv2.convertScaleAbs(aug_img, alpha=1.2, beta=25)
    elif choice == 'dark':
        aug_img = cv2.convertScaleAbs(aug_img, alpha=0.8, beta=-25)
    elif choice == 'contrast':
        alpha = random.uniform(1.3, 1.8)
        aug_img = cv2.convertScaleAbs(aug_img, alpha=alpha, beta=0)
    return aug_img

def load_templates(template_path):
    with open(template_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def collect_image_paths(data_root):
    image_infos = []
    for set_id in os.listdir(data_root):
        set_path = os.path.join(data_root, set_id)
        if not os.path.isdir(set_path):
            continue
        for subtype in os.listdir(set_path):
            subtype_path = os.path.join(set_path, subtype)
            # Tìm ảnh trong temp_card/{set_id}/{subtype}/image/
            image_dir = os.path.join(subtype_path, "image")
            if os.path.isdir(image_dir):
                for fname in os.listdir(image_dir):
                    if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                        image_infos.append({
                            "set_id": set_id,
                            "subtype": subtype,
                            "image_path": os.path.join(image_dir, fname)
                        })
            # Tìm ảnh trực tiếp trong temp_card/{set_id}/{subtype}/
            for fname in os.listdir(subtype_path):
                if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                    image_infos.append({
                        "set_id": set_id,
                        "subtype": subtype,
                        "image_path": os.path.join(subtype_path, fname)
                    })
    return image_infos

def split_dataset(image_infos, train_ratio=0.8):
    random.shuffle(image_infos)
    n_train = int(len(image_infos) * train_ratio)
    train_set = image_infos[:n_train]
    val_set = image_infos[n_train:]
    return train_set, val_set

def process_split(image_infos, templates, out_img_dir, out_lbl_dir):
    ensure_dir(out_img_dir)
    ensure_dir(out_lbl_dir)
    idx = 1
    for info in tqdm(image_infos, desc=f"Processing {out_img_dir}"):
        set_id = info["set_id"]
        subtype = info["subtype"]
        img_path = info["image_path"]
        template = templates.get(set_id, {}).get(subtype)
        if template is None:
            print(f"[SKIP] Không có template cho set '{set_id}' subtype '{subtype}'")
            continue
        print(f"Template cho {set_id}/{subtype}: {template}")
        img = cv2.imread(img_path)
        if img is None:
            print(f"[SKIP] Không đọc được ảnh: {img_path}")
            continue
        img = augment_image(img)
        resized, scale, pad_x, pad_y = letterbox_resize(img, IMG_SIZE)
        h, w = resized.shape[:2]
        yolo_labels = []
        for class_name in CLASSES:
            box = template.get(class_name)
            if not box:
                print(f"[WARN] Không có bbox cho '{class_name}' trong set '{set_id}' subtype '{subtype}'")
                continue
            # scale box to resized image
            x, y, bw, bh = box
            x = x * scale + pad_x
            y = y * scale + pad_y
            bw = bw * scale
            bh = bh * scale
            x_center, y_center, norm_w, norm_h = convert_to_yolo([x, y, bw, bh], w, h)
            cls_id = CLASSES.index(class_name)
            yolo_labels.append(f"{cls_id} {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f}")
        # Giữ nguyên tên ảnh gốc
        file_stem = os.path.splitext(os.path.basename(img_path))[0]
        out_img_path = os.path.join(out_img_dir, f"{file_stem}.jpg")
        out_lbl_path = os.path.join(out_lbl_dir, f"{file_stem}.txt")
        cv2.imwrite(out_img_path, resized)
        with open(out_lbl_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(yolo_labels))
        print(f"[OK] {set_id}/{subtype}: {img_path} -> {out_img_path}, {out_lbl_path}")
        idx += 1

def main():
    print("=== BẮT ĐẦU CHUẨN HÓA DỮ LIỆU YOLO ===")
    ensure_dir(OUTPUT_DIR)
    templates = load_templates(TEMPLATE_PATH)
    image_infos = collect_image_paths(DATA_ROOT)
    train_set, val_set = split_dataset(image_infos, TRAIN_RATIO)
    # Output dirs
    train_img_dir = os.path.join(OUTPUT_DIR, "train_data", "images")
    val_img_dir = os.path.join(OUTPUT_DIR, "val_data", "images")
    train_lbl_dir = os.path.join(OUTPUT_DIR, "train_data", "labels")
    val_lbl_dir = os.path.join(OUTPUT_DIR, "val_data", "labels")
    process_split(train_set, templates, train_img_dir, train_lbl_dir)
    process_split(val_set, templates, val_img_dir, val_lbl_dir)
    print("✅ Dữ liệu YOLO đã được tạo tại:", OUTPUT_DIR)

if __name__ == "__main__":
    main()
