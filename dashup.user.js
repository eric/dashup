// ==UserScript==
// @name        dashup
// @namespace   http://sevenscale.com
// @description Automatically update dash once a minute
// @include     https://dash.fiveruns.com/reports/*
// @author      Eric Lindvall <eric@5stops.com>
// ==/UserScript==

(function () {
    var updateElements = function() {
        $('.bottlenecks').each(function() {
          var parts = $(this).attr('id').split('_app_');
          var sort = parts[0];
          var app_id = parts[1];
          var data = {sort: sort}
          var host_match = $(this).attr('class').match(/host-(\d+)/);
          if(host_match)
            data.host_ids = host_match[1];
          var host;
          if(host_match)
            host = host_match[1];
          $.ajax({
            url: "/apps/" + app_id + "/bottlenecks",
            data: data,
            dataType: "script",
            method: "GET"
          });
        });

        // Create sets of sparklines
        var sparklineMetrics = $('.sparkline').map(function() {
          var spark = $(this);
          var values = /^sparkline-app_(\d+)-metric_info_(\d+)-show_(\w+)/.exec(spark.attr('id'));
          if (values != null)
            return $([spark.attr('id'), values[1], values[2], values[3]]);
        });

        if(sparklineMetrics.length > 0) {
          var params = {
            period: currentPeriod,
            host_ids: currentHostId
          };
          $(sparklineMetrics).each(function(e) {
            params['sparklines[' + e + '][app_id]'] = $(this)[1];
            params['sparklines[' + e + '][metric_info_id]'] = $(this)[2];
            params['sparklines[' + e + '][show]'] = $(this)[3];
          });
          $.post("/sparklines", params, function(data) {
            $.each(data, function(info_id, info) {
              $('*[id^=sparkline][id*=metric_info_' + info_id + '-]').each(function() {
                var row = $(this);
                if (info.values.length > 1) {
                  row.find('.framing').sparkline(info.values,
                    {height: 18, width: 120,
                     minSpotColor:false, maxSpotColor:false,
                     spotRadius:2, spotColor:'#000'
                  }).find('canvas').click(function() { 
                    window.location = row.find('a').attr('href');
                  });
                } else {
                  $(this).find('.framing').html('No trend yet');
                }
                show_as = this.id.split('-')[3];
                if(show_as == null) {
                  return;
                }  
                value_format = show_as.substr(5);

                $(this).find('.current').html(
                   "<span>" + valueFormatDisplayStringFor(value_format) + "</span> " + info[value_format]
                );
              });
            });
            $('.sparkline .framing img').parents('td').html("No data").parents('tr').addClass('empty').find('.current').html('<span>&mdash;</span>');
          }, "json");   
        }
    };
    
    setInterval(updateElements, 30 * 1000);
})();
