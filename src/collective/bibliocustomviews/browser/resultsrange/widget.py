""" Sorting widget
"""
from Products.Archetypes.public import Schema
from Products.Archetypes.public import StringField
from Products.Archetypes.public import StringWidget
from Products.Archetypes.public import SelectionWidget
from Products.CMFCore.utils import getToolByName
from Products.ATContentTypes.criteria import _criterionRegistry

from eea.facetednavigation.widgets import ViewPageTemplateFile
from eea.facetednavigation.widgets.widget import Widget as AbstractWidget, CountableWidget
from eea.facetednavigation import EEAMessageFactory as _
from Products.Archetypes.public import Schema
from Products.Archetypes.public import IntegerField
from Products.Archetypes.public import IntegerWidget

from eea.facetednavigation.widgets import ViewPageTemplateFile
from eea.facetednavigation.widgets.widget import Widget as AbstractWidget
from eea.facetednavigation import EEAMessageFactory as _
import logging

logger = logging.getLogger('collective.bibliocustomviews.widgets.resultsrange')

EditSchema = Schema((
    IntegerField('step',
                 schemata="default",
                 default=500,
                 widget=IntegerWidget(
                     label=_(u'Step'),
                     description=_(u'Results range step'),
                     i18n_domain="eea"
                 )
                 ),
    IntegerField('end',
                 schemata="default",
                 default=2000,
                 widget=IntegerWidget(
                     label=_(u'End'),
                     description=_(u'Last range start value'),
                     i18n_domain="eea"
                 )
                 ),
    IntegerField('default',
        schemata="default",
        default=0,
        widget=IntegerWidget(
            label=_(u'Default value'),
            description=_(u'Default range start value'),
            i18n_domain="eea"
        )
    ),
))

ALL_VALUE = '--all--'


class Widget(CountableWidget):
    """ Widget
    """
    # Widget properties
    widget_type = 'resultsrange'
    widget_label = _('Results range')
    view_js = '++resource++collective.bibliocustomviews.resultsrange.view.js'
    edit_js = '++resource++collective.bibliocustomviews.resultsrange.edit.js'
    view_css = '++resource++collective.bibliocustomviews.resultsrange.view.css'

    index = ViewPageTemplateFile('widget.pt')
    edit_schema = CountableWidget.edit_schema.copy() + EditSchema
    edit_schema['title'].default = 'Results range'
    del edit_schema['sortcountable']

    @property
    def default(self):
        """ Get default values
        """
        value = self.data.get('default', 0) or 0
        if value == ALL_VALUE:
            return ALL_VALUE

        try:
            return int(value)
        except (TypeError, ValueError), err:
            logger.exception(err)
            return ALL_VALUE

    def query(self, form):
        """ Get value from form and return a catalog dict query
        """
        query = {}

        if self.hidden:
            default = self.default
            start = len(str(default)) > 0 and default or 0
        else:
            start = form.get(self.data.getId(), 0) or 0

        if start == ALL_VALUE or (self.request.form.get('excelexport.policy', '') == 'eea.facetednavigation'):
            query['b_size'] = None
            return query

        try:
            start = int(start)
        except ValueError:
            return query

        query['b_size'] = int(self.data.get('step', 500))
        query['b_start'] = start
        return query

    def _get_step(self):
        try:
            step = int(self.data.get('step', 500))
        except (TypeError, ValueError), err:
            logger.exception(err)
            step = 1000

        return step

    def vocabulary(self, **kwargs):
        """ Vocabulary
        """
        try:
            end = int(self.data.get('end', 2000)) + 1
        except (TypeError, ValueError), err:
            logger.exception(err)
            end = 2001

        step = self._get_step()
        ranges = [(x, ("%s - %s" % (x, x + step)))
                  for x in range(0, end, step)]
        ranges.append((ALL_VALUE, _("All results")))
        return ranges

    def count(self, brains, sequence=None):
        """ Intersect results
        """
        res = {}
        if not sequence:
            sequence = [key for key, value in self.vocabulary()]

        if not sequence:
            return res

        try:
            total_count = brains.actual_result_count
        except AttributeError:
            total_count = brains.size  # PloneBatch.Batch
        step = self._get_step()

        mod = total_count
        for value in sequence:
            if value == ALL_VALUE:
                res[value] = total_count
            elif mod < 0:
                res[value] = 0
            elif mod / step == 0:
                res[value] = mod % step
            else:
                res[value] = step
            mod -= step

        return res
