var trelloGithub = (function($, Trello) {
  var exports = {};

  var popoverOffset = {top: 581, left: 1123}; //default value, should change before showing.

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
  }

  var createIssue = exports.createIssue = function(event) {
    Trello.authorize({type:"popup", scope:{read:true, write:true, account:false}, name:"Trello-Github", success:function(){
      console.log('authorized');
    }});
  }

  function setupPopover() {
    popover_html = '<div id="github-popover" class="pop-over clearfix fancy-scrollbar" style="left:' + popoverOffset.left + 'px; top: ' + popoverOffset.top + 'px; max-height: 891px; display: none;"></div>';
    $('body').append(popover_html);
    $('#github-popover').load(chrome.extension.getURL('popover.html'), null, function(){
      $('.js-close-github-popover').click(function(e){$('#github-popover').hide();});
      $('body').click(function(e) {
        if ($(e.target).parents().index($('#github-popover') == -1)) {
          $('#github-popover').hide();
        }
      });
      $('.button-link:not(.js-github-issue)').click(function(e){$('#github-popover').hide();});
      $('.js-create-github-issue').click(createIssue);
    });
  }

  setupPopover();

  return exports;
})(jQuery, Trello);

ob = new MutationObserver(function(objs, observer){
  var wasHidden = $.inArray('visibility: hidden', $.map(objs, function(o){return o['oldValue'];}).join().split(/;,? ?/)) != -1;
  if($('.window').is(':visible') && wasHidden) {
    trelloGithub.addButton();
  }
});

//trigger ob's callback every time the style attribute on window changes
ob.observe($('.window')[0], {attributes:true, attributeFilter:['style'], attributeOldValue:true})
