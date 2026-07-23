import os
import re

# 指定只处理根目录下的这三个文件夹
TARGET_FOLDERS = ['setu', 'zrsetu', 'acg']

# CSS 目标路径（如需更改目录或文件名，直接改这里）
CSS_REF_PATH = '/css/common.css'
JS_REF_PATH = '/js/common.js'

# CSS 特征判断关键词（用于精准匹配，防止误伤其他页面的 style）
CSS_SIGNATURES = [
    ".image-grid",
    ".fixed-button",
    ".prev-next-card",
    "@keyframes shimmer"
]

# JS 特征判断关键词
JS_SIGNATURES = [
    "IntersectionObserver",
    "prev-link",
    "save-blue",
    "updateButtonVisibility"
]

# 正则表达式
style_pattern = re.compile(r'<style\b[^>]*>([\s\S]*?)</style>', re.IGNORECASE)
script_pattern = re.compile(r'<script\b[^>]*>([\s\S]*?)</script>', re.IGNORECASE)

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    modified = False

    # 替换 CSS <style> -> <link>
    def replace_style(match):
        nonlocal modified
        css_code = match.group(1)
        if all(sig in css_code for sig in CSS_SIGNATURES):
            modified = True
            return f'<link rel="stylesheet" href="{CSS_REF_PATH}">'
        return match.group(0)

    # 替换 JS <script> -> <script src="...">
    def replace_script(match):
        nonlocal modified
        script_code = match.group(1)
        if all(sig in script_code for sig in JS_SIGNATURES):
            modified = True
            return f'<script src="{JS_REF_PATH}"></script>'
        return match.group(0)

    # 执行替换
    new_content = style_pattern.sub(replace_style, content)
    new_content = script_pattern.sub(replace_script, new_content)

    # 覆盖保存
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"[已更新] {file_path}")
    else:
        print(f"[跳过/未匹配] {file_path}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    for folder in TARGET_FOLDERS:
        target_path = os.path.join(base_dir, folder)
        
        if not os.path.exists(target_path):
            print(f"[提示] 找不到文件夹: {folder}")
            continue

        for root, _, files in os.walk(target_path):
            for file in files:
                if file.lower().endswith('.html'):
                    file_path = os.path.join(root, file)
                    process_file(file_path)

if __name__ == '__main__':
    main()