from . import invitations, notifications, users, medicines, grouped

# Ensure submodules are imported for side effects (route registration)
_SHARING_ROUTES = [invitations, notifications, users, medicines, grouped]

__all__ = []
for module in _SHARING_ROUTES:
    if hasattr(module, "__all__"):
        __all__ += module.__all__
