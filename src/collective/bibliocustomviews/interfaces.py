from Products.PluggableAuthService.interfaces.authservice import IPropertiedUser
from zope import interface, schema
from plone.theme.interfaces import IDefaultPloneLayer

from collective.bibliocustomviews import MessageFactory as _

class IMyPortalUser(IPropertiedUser):
    """ Marker interface implemented by users in my portal. """

class IThemeSpecific(IDefaultPloneLayer):
    """Marker interface that defines a Zope 3 browser layer and a plone skin marker.
    """

class ILayer(interface.Interface):
    """Marker interface that defines a Zope 3 browser layer.
    """ 

class IResourcesEnabled(interface.Interface):
    """."""

class ISummaryViewEnabled(IResourcesEnabled):
    """."""

class IDatatableViewEnabled(IResourcesEnabled):
    """.""" 

class ISearchViewEnabled(IResourcesEnabled):
    """."""  
