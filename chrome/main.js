var trelloGithub = (function($, Handlebars) {
  var exports = {};

  var popoverOffset;

  var jsGithubIssue = exports.jsGithubIssue = function() {
    var popover = $('#github-popover');
    popover.toggle();
    popover.offset(popoverOffset);
  }

  var addButton = exports.addButton = function() {
    var btnhtml = '<a class="button-link js-github-issue" title="Create cooresponding github issue">\n'
      + '  <span class="icon-sm"></span> GitHub Issue...\n'
      + '</a>';
    var link = $(btnhtml).insertBefore($('div.other-actions div.js-subscribe-sidebar-button'));
    link.click(jsGithubIssue);
    popoverOffset = link.offset();
    popoverOffset.top += link.height() + 18;

    popover_html = Handlebars.templates.popover(popoverOffset);
    $('body').append(popover_html);
  }

  return exports;
})(jQuery, Handlebars);
