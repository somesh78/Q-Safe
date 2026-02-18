from django.apps import AppConfig


class TransfersConfig(AppConfig):
    name = 'transfers'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # Import signals so the post_save receiver is registered
        import transfers.models  # noqa: F401
