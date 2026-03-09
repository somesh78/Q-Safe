
from django.contrib.auth.models import User
empty_users = User.objects.filter(email='')
print(f'Deleting {empty_users.count()} users with empty emails')
empty_users.delete()

