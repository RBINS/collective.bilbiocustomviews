/* ResultsRange Widget
*/
Faceted.ResultsRangeWidget = function(wid){
  this.wid = wid;
  this.widget = jQuery('#' + this.wid + '_widget');
  this.widget.show();
  this.title = jQuery('legend', this.widget).html();
  this.elements = jQuery('option', this.widget);
  this.select = jQuery('#' + this.wid);
  this.selected = [];

  // Faceted version
  this.version = '';
  var version = jQuery('#faceted-version');
  if(version){
    this.version = version.text();
  }

  // Handle change
  jQuery('form', this.widget).submit(function(){
    return false;
  });

  var js_widget = this;
  this.select.change(function(evt){
    js_widget.select_change(this, evt);
  });

  // Default value
  var value = this.select.val();
  if(value){
    this.selected = jQuery("option[value='" + value + "']", js_widget.widget);
    Faceted.Query[this.wid] = [value];
  }

  // Bind events
  jQuery(Faceted.Events).bind(Faceted.Events.QUERY_CHANGED, function(evt){
    js_widget.synchronize();
  });
  jQuery(Faceted.Events).bind(Faceted.Events.RESET, function(evt){
    js_widget.reset();
  });
  if(this.widget.hasClass('faceted-count')){
    jQuery(Faceted.Events).bind(Faceted.Events.QUERY_INITIALIZED, function(evt){
      js_widget.count();
    });
    jQuery(Faceted.Events).bind(Faceted.Events.FORM_DO_QUERY, function(evt, data){
      if(data.wid == js_widget.wid || data.wid == 'b_start'){
        return;
      }
      js_widget.count();
    });
  }
};

Faceted.ResultsRangeWidget.prototype = {
  select_change: function(element, evt){
    if(!jQuery(element).val()){
      element = null;
    }
    this.do_query(element);
  },

  do_query: function(element){
    if(!element){
      this.selected = [];
      return Faceted.Form.do_query(this.wid, []);
    }else{
      var value = jQuery(element).val();
      this.selected = jQuery("#" + this.wid + "_widget option[value='" + value + "']");
      return Faceted.Form.do_query(this.wid, value);
    }
  },

  reset: function(){
    this.select.val("");
    this.selected = [];
  },

  synchronize: function(){
    var value = Faceted.Query[this.wid];
    if(!value){
      this.reset();
      return;
    }

    var context = this;
    jQuery.each(value, function(){
      var selected = jQuery("option[value='" + value + "']", context.widget);
      if(!selected.length){
        context.reset();
      }else{
        context.selected = selected;
        context.select.val(value);
      }
    });
  },

  criteria: function(){
    var html = [];
    var title = this.criteria_title();
    var body = this.criteria_body();
    if(title){
      html.push(title);
    }
    if(body){
      html.push(body);
    }
    return html;
  },

  criteria_title: function(){
    if(!this.selected.length){
      return '';
    }

    var link = jQuery('<a href="#">[X]</a>');
    link.attr('id', 'criteria_' + this.wid);
    link.attr('title', 'Remove ' + this.title + ' filters');
    var widget = this;
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });

    var html = jQuery('<dt>');
    html.attr('id', 'criteria_' + this.wid + '_label');
    html.append(link);
    html.append('<span>' + this.title + '</span>');
    return html;
  },

  criteria_body: function(){
    if(!this.selected.length){
      return '';
    }

    var widget = this;
    var html = jQuery('<dd>');
    var span = jQuery('<span class="facted-resultsrange-criterion">');
    html.attr('id', 'criteria_' + this.wid + '_entries');
    var element = jQuery(this.selected);
    var value = element.val();
    var label = element.attr('title');
    var link = jQuery('<a href="#">[X]</a>');

    link.attr('id', 'criteria_' + this.wid + '_' + value);
    link.attr('title', 'Remove ' + label + ' filter');
    link.click(function(evt){
      widget.criteria_remove();
      return false;
    });
    span.append(link);
    jQuery('<span>').text(label).appendTo(span);
    html.append(span);

    return html;
  },

  criteria_remove: function(){
    this.select.val('');
    this.do_query();
  },

  count: function(){
    var query = Faceted.SortedQuery();
    query.cid = this.wid;
    if(this.version){
      query.version = this.version;
    }

    var context = this;
    jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_START, {wid: context.wid});
    jQuery.getJSON(Faceted.BASEURL + '@@faceted_counter', query, function(data){
      context.count_update(data);
      jQuery(Faceted.Events).trigger(Faceted.Events.AJAX_STOP, {wid: context.wid});
    });
  },

  count_update: function(data){
    var context = this;
    var select = jQuery('select', context.widget);
    var options = jQuery('option', context.widget);

    // get the last page with items using count data
    var min_count = 9999999999;
    var min_value = 9999999999;
    for (var value in data) {
      if (data.hasOwnProperty(value)) {
        var count = data[value];
        if (value != '--all--' && count !== 0 && count !== data[0]) {
          // count !== data[0]: prevent display count when count of last page is equal to step
          if (count <= min_count) {
              min_count = count;
              min_value = value;
          }
        }
      }
    }

    jQuery(options).each(function(index){
      var option = jQuery(this);
      option.removeClass('faceted-select-item-disabled');
      option.attr('disabled', false);
      var key = option.val();

      var value = data[key];
      value = value ? value : 0;
      var option_txt = option.attr('title');
      // display count on last and all entries only
      if (key == '--all--' || key == min_value) {
        option_txt += ' (' + value + ')';
      }

      option.html(option_txt);
      if(!value || (key == '--all--' && min_value == 0)){
          // hide all value if min value is start value (there is only one choice)
        option.attr('disabled', 'disabled');
        option.addClass('faceted-select-item-disabled');
      }
    });
  }
};

Faceted.initializeResultsRangeWidget = function(evt){
  jQuery('div.faceted-resultsrange-widget').each(function(){
    var wid = jQuery(this).attr('id');
    wid = wid.split('_')[0];
    Faceted.Widgets[wid] = new Faceted.ResultsRangeWidget(wid);
  });
};

jQuery(document).ready(function(){
  jQuery(Faceted.Events).bind(
    Faceted.Events.INITIALIZE,
    Faceted.initializeResultsRangeWidget);
});
