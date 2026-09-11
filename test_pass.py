import subprocess
passwords = ['', '""', '\"\"', '"', ' ', '""\""']
for p in passwords:
    try:
        subprocess.check_output(['ssh-keygen', '-y', '-f', r'C:\Users\RASHID FAROOQ\.ssh\id_ed25519', '-P', p], stderr=subprocess.STDOUT)
        print("FOUND: " + p)
        break
    except subprocess.CalledProcessError:
        pass
print("Done")
