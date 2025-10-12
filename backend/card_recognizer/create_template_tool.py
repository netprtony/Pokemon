import cv2
import os
import numpy as np
import json
from typing import List, Tuple, Dict

# Biến toàn cục để lưu tọa độ
ref_point: List[Tuple[int, int]] = []
current_label = ""
rectangles: Dict[str, List[int]] = {}
base_image: np.ndarray | None = None
display_image: np.ndarray | None = None
history: List[Dict[str, List[int] | None]] = []

def snapshot_state():
    history.append({k: (v[:] if v else None) for k, v in rectangles.items()})

def undo_last(window_name="Image"):
    global rectangles
    if not history:
        print("Không còn thao tác để undo.")
        return
    rectangles = history.pop()
    redraw_display(window_name)

def redraw_display(window_name="Image"):
    global display_image, base_image, rectangles
    if base_image is None:
        return
    display_image = base_image.copy()
    for label, box in rectangles.items():
        if not box:
            continue
        x, y, w, h = box
        cv2.rectangle(display_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(
            display_image,
            label.upper(),
            (x, max(y - 8, 15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            1,
            cv2.LINE_AA,
        )
    cv2.imshow(window_name, display_image)

def click_and_crop(event, x, y, flags, param):
    global ref_point, current_label, rectangles

    if base_image is None:
        return

    if event == cv2.EVENT_LBUTTONDOWN:
        ref_point = [(x, y)]

    elif event == cv2.EVENT_LBUTTONUP and ref_point:
        ref_point.append((x, y))
        x1, y1 = ref_point[0]
        x2, y2 = ref_point[1]
        left, right = sorted([x1, x2])
        top, bottom = sorted([y1, y2])

        snapshot_state()
        rectangles[current_label] = [left, top, right - left, bottom - top]
        redraw_display()
        print(f"Đã lưu tọa độ cho '{current_label}': {rectangles[current_label]}")

def get_coords_for_set(image_paths):
    global current_label, rectangles, base_image, display_image, history

    idx = 0
    total = len(image_paths)
    window_name = "Template Preview"
    rectangles = {}
    history = []

    cv2.namedWindow(window_name)
    cv2.setMouseCallback(window_name, click_and_crop)

    instructions = "Nhấn giữ chuột trái để vẽ. Nhấn 'c' để xác nhận, 'r' để vẽ lại khung đang chọn, 'u' để hoàn tác, 'm' để chuyển ảnh tiếp, 'n' để quay lại ảnh trước."

    def capture(label: str):
        global current_label
        current_label = label
        print(f"\n>>> VẼ HỘP CHO '{label.upper()}'. {instructions}")
        while True:
            cv2.imshow(window_name, display_image)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("c"):
                if rectangles.get(current_label):
                    break
                print("Chưa có khung hợp lệ, hãy vẽ trước khi xác nhận.")
            elif key == ord("r"):
                if rectangles.get(current_label):
                    snapshot_state()
                    rectangles[current_label] = None
                print("Đã xóa khung hiện tại, vui lòng vẽ lại.")
                redraw_display(window_name)
            elif key == ord("u"):
                undo_last(window_name)
            elif key == ord("m"):
                return 'next'
            elif key == ord("n"):
                return 'prev'

    while idx < total:
        image_path = image_paths[idx]
        print(f"\nĐang xem ảnh {idx+1}/{total}: {image_path}")
        base_image = cv2.imread(image_path)
        if base_image is None:
            print(f"Lỗi đọc ảnh: {image_path}")
            idx += 1
            continue

        redraw_display(window_name)

        # Vẽ cho name nếu chưa có
        if "name" not in rectangles or rectangles["name"] is None:
            result = capture("name")
            if result == 'next':
                idx = min(idx + 1, total - 1)
                continue
            elif result == 'prev':
                idx = max(idx - 1, 0)
                continue

        # Vẽ cho card_number nếu chưa có
        if "card_number" not in rectangles or rectangles["card_number"] is None:
            result = capture("card_number")
            if result == 'next':
                idx = min(idx + 1, total - 1)
                continue
            elif result == 'prev':
                idx = max(idx - 1, 0)
                continue

        # Khi đã có cả 2 khung, cho phép chuyển ảnh để kiểm tra template
        while True:
            redraw_display(window_name)
            cv2.imshow(window_name, display_image)
            key = cv2.waitKey(0) & 0xFF
            if key == ord("m"):
                idx = min(idx + 1, total - 1)
                break
            elif key == ord("n"):
                idx = max(idx - 1, 0)
                break
            elif key == ord("r"):
                # Xóa cả hai khung để vẽ lại
                snapshot_state()
                rectangles["name"] = None
                rectangles["card_number"] = None
                print("Đã xóa cả hai khung, vui lòng vẽ lại.")
                break
            elif key == ord("u"):
                undo_last(window_name)
            elif key == ord("c"):
                # Xác nhận template này
                cv2.destroyWindow(window_name)
                cleaned = {k: v for k, v in rectangles.items() if v}
                base_image = None
                display_image = None
                return cleaned

    cv2.destroyWindow(window_name)
    base_image = None
    display_image = None
    return None

# --- Bắt đầu sử dụng công cụ ---
if __name__ == '__main__':
    # Đường dẫn thư mục chứa các set
    root_dir = r'D:/Pokemon/backend/script_db/temp_card'
    set_ids = [d for d in os.listdir(root_dir) if os.path.isdir(os.path.join(root_dir, d))]

    all_templates = {}

    for set_id in set_ids:
        set_folder = os.path.join(root_dir, set_id)
        image_files = [os.path.join(set_folder, f) for f in os.listdir(set_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        if not image_files:
            print(f"Bỏ qua {set_id} vì không có ảnh.")
            continue

        print(f"\n===== Đang tạo template cho set: {set_id} =====")
        coords = get_coords_for_set(image_files)
        if coords and 'name' in coords and 'card_number' in coords:
            all_templates[set_id] = coords
            print(f"Đã tạo template thành công cho {set_id}")
        else:
            print(f"Bỏ qua {set_id} do không đủ tọa độ.")

    # Lưu tất cả template vào một file JSON
    with open('layout_templates.json', 'w') as f:
        json.dump(all_templates, f, indent=2)

    print("\nHoàn tất! Đã lưu tất cả template vào file 'layout_templates.json'")