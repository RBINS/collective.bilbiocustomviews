from ecreall.helpers.upgrade.interfaces import IUpgradeTool


def upgrade12(context):
    IUpgradeTool(context).refreshResources()
