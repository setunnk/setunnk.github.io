import os

def replace_links_in_html(directories):
    # 需要替换的目标字符串和替换后的字符串
    target_str = '<div class="fixed-button"><a href="https://setutime.com">SetuTime 合集</a>'
    replace_str = '<div class="fixed-button"><a href="/">SetuTime 合集</a>'
    
    count = 0
    
    for directory in directories:
        if not os.path.exists(directory):
            print(f"目录不存在，跳过: {directory}")
            continue
            
        print(f"正在扫描目录: {directory} ...")
        
        # 递归遍历目录下的所有文件
        for root, dirs, files in os.walk(directory):
            for file in files:
                # 只处理 html 或 htm 后缀的文件
                if file.lower().endswith(('.html', '.htm')):
                    file_path = os.path.join(root, file)
                    
                    try:
                        # 读取文件内容
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # 判断是否包含目标字符串
                        if target_str in content:
                            # 替换内容
                            new_content = content.replace(target_str, replace_str)
                            
                            # 写回文件
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            
                            print(f"已修改: {file_path}")
                            count += 1
                    except Exception as e:
                        print(f"处理文件失败 {file_path}: {e}")
                        
    print(f"\n替换完成！共修改了 {count} 个文件。")

if __name__ == "__main__":
    # 在这里配置你的目录路径列表，可以是绝对路径或相对路径
    # 请根据你服务器或本地的实际路径进行修改
    target_directories = [
        "./zrsetu",
        "./setu"
    ]
    
    replace_links_in_html(target_directories)