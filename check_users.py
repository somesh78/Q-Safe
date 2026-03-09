
from django.contrib.auth.models import User
from transfers.models import UserProfile
for u in User.objects.all():
    profile = UserProfile.objects.filter(user=u).first()
    verified = profile.is_verified if profile else None
    print(f'Email: {u.email}, Username: {u.username}, Verified: {verified}')

