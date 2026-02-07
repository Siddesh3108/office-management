import os

def consolidate_project(output_file="full_project_code.txt"):
    # 1. File types to include
    valid_extensions = {
        ".py", ".js", ".jsx", ".html", ".css", 
        ".json", ".yml", ".yaml", ".txt", ".md"
    }
    
    # 2. Specific filenames without extensions to include
    valid_filenames = {
        "Dockerfile", "docker-compose.yml", ".env", ".gitignore"
    }

    # 3. Folders to ignore (keeps the file clean)
    ignore_folders = {
        "node_modules", "__pycache__", ".git", ".vscode", 
        "dist", "build", "venv", "env", ".idea"
    }

    # Get the current directory where this script is running
    root_dir = os.getcwd()

    with open(output_file, "w", encoding="utf-8") as out:
        for current_root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to skip ignored folders
            dirs[:] = [d for d in dirs if d not in ignore_folders]

            for file in files:
                file_ext = os.path.splitext(file)[1]
                
                # Check if we should read this file
                if file_ext in valid_extensions or file in valid_filenames:
                    file_path = os.path.join(current_root, file)
                    relative_path = os.path.relpath(file_path, root_dir)

                    # Skip the output file itself and this script
                    if file == output_file or file == "consolidate.py":
                        continue

                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                            
                            # Write a clear header for each file
                            out.write(f"\n{'='*60}\n")
                            out.write(f"FILE PATH: {relative_path}\n")
                            out.write(f"{'='*60}\n\n")
                            out.write(content)
                            out.write("\n")
                            
                        print(f"✅ Added: {relative_path}")
                    except Exception as e:
                        print(f"❌ Could not read {relative_path}: {e}")

if __name__ == "__main__":
    print("🚀 Starting project consolidation...")
    consolidate_project()
    print("\n✨ Done! Upload 'full_project_code.txt' for review.")