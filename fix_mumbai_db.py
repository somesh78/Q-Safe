import os

path = '/home/ec2-user/Q-Safe/backend/backend/settings.py'
if os.path.exists(path):
    with open(path, 'r') as f:
        c = f.read()
    # Replace both single and double quote versions just in case
    c = c.replace("DATABASES['default']['OPTIONS']['sslmode'] = 'require'", 
                  "DATABASES['default']['OPTIONS']['sslmode'] = 'disable'")
    c = c.replace('DATABASES["default"]["OPTIONS"]["sslmode"] = "require"', 
                  'DATABASES["default"]["OPTIONS"]["sslmode"] = "disable"')
    with open(path, 'w') as f:
        f.write(c)
    print('Fixed settings.py')
else:
    print(f'File not found: {path}')
