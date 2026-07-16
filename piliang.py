import os

def batch_replace_html_links(target_dirs):
    # 需要替换的对应规则（支持 setu、zrsetu、acg 等多种情况）
    replacements = {
        "prevLink.href = `https://setutime.com/setu/${prevNo}`;" : "prevLink.href = `https://www.setutime.com/setu/${prevNo}`;",
        "prevLink.href = `https://setutime.com/zrsetu/${prevNo}`;" : "prevLink.href = `https://www.setutime.com/zrsetu/${prevNo}`;",
        "prevLink.href = `https://setutime.com/acg/${prevNo}`;" : "prevLink.href = `https://www.setutime.com/acg/${prevNo}`;"
    }
    
    modified_count = 0
    skipped_count = 0
    
    for folder in target_dirs:
        # 确保目录存在
        if not os.path.exists(folder):
            print(f"提示: 目录 '{folder}' 不存在，已跳过。")
            continue
            
        print(f"正在扫描目录: {folder}")
        
        # os.walk 会递归遍历子目录下的所有文件和深层子文件夹
        for root, dirs, files in os.walk(folder):
            for file in files:
                if file.lower().endswith(('.html', '.htm')):
                    file_path = os.path.join(root, file)
                    
                    try:
                        # 读取文件内容
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        
                        # 检查是否有需要替换的内容
                        has_match = False
                        updated_content = content
                        for old_str, new_str in replacements.items():
                            if old_str in updated_content:
                                updated_content = updated_content.replace(old_str, new_str)
                                has_match = True
                        
                        if has_match:
                            # 只有在发生匹配和修改后才写回文件
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(updated_content)
                            print(f"  [已修改] {file_path}")
                            modified_count += 1
                        else:
                            skipped_count += 1
                    except Exception as e:
                        print(f"  [读取失败/错误] 无法处理文件 {file_path}: {e}")
                        
    print(f"\n处理完成! 共修改了 {modified_count} 个文件，安全跳过了 {skipped_count} 个未匹配文件。")

if __name__ == "__main__":
    # 配置你要扫描的子目录（相对路径或绝对路径均可）
    folders_to_scan = ["zrsetu", "setu", "acg"]
    batch_replace_html_links(folders_to_scan)