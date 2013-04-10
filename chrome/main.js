var trelloGithub = (function($, Trello) {
  var exports = {};

  var popoverOffset = {top: 581, left: 1123}; //default value, should change before showing.
  var githubKey;

  var githubAuth = exports.githubAuth = function() {
    githubKey = localStorage.getItem('githubKey');

    var params = {};
    location.search.replace('?', '').split('&').map(function(e, i){
      var kv = e.split('=');
      this[kv[0]] = kv[1];
    }, params);
    //location.search = '';

    var code;
    if (params['code'] != null) // if we have been passed a code, reauth
      code = params['code'];
    else if (githubKey == null) { // if we have no token and no code, get a code
      location.href = 'https://github.com/login/oauth/authorize?client_id=7e75915ed424adcab18a&scope=repo&redirect_uri='+location.href
      return;
    }

    if (code == null && githubKey != null)
      return;

    $.ajax({
      url:'https://github.com/login/oauth/access_token',
      type:'POST',
      async:false,
      contentType:'application/json',
      data:JSON.stringify({
        client_id:'7e75915ed424adcab18a',
        client_secret:'7c15acf6686b5c574cad071967919bb2a17ef39a',
        code:code
      }),
      dataType:'json',
      success:function(data, textStatus, jqXHR){
        githubKey = data['access_token'];
        if (githubKey != null)
          localStorage.setItem('githubKey', githubKey);
        else {
          alert('gitub auth error');
        }
      },
      error:function(jqXHR, textStatus, errorThrown){
        console.log(errorThrown);
        alert('gitub auth error');
      }
    });
  }

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

    $('.button-link:not(.js-github-issue)').click(function(e){
      $('#github-popover').hide();
    });
  }

  function addToKnownRepos(repo) {
    var knownRepos = JSON.parse(localStorage.getItem('knownRepos'));
    if (knownRepos == null)
      knownRepos = [];
    if (knownRepos.indexOf(repo) === -1)
      knownRepos.push(repo);
    localStorage.setItem('knownRepos', JSON.stringify(knownRepos));
  }

  var createIssue = exports.createIssue = function(event) {
    if (!['#github-repo', '#issue-title'].map(function(e){return validate(e);}).reduce(function(p, c, i, a){return p&&c;}, true))
      return;

    var pathparts = location.pathname.split('/');
    var boardId = pathparts[pathparts.length - 2];
    var cardShortId = pathparts[pathparts.length - 1];
    Trello.authorize({type:"popup", scope:{read:true, write:true, account:false}, name:"Trello-Github", success:function() {

      var addToChecklist = function(checklist, issue) {
        if (checklist == null || issue == null) {
          alert('some sort of error');
          return;
        }

        Trello.post('/checklists/' + checklist.id + '/checkItems', {name:issue.html_url}, function() {
          //hooray!  we've completed everything.
          $('#github-popover').hide();
          //window.location.reload();
        }, function() {
          alert('trello api error');
        });
      }

      Trello.get('/boards/' + boardId + '/cards/' + cardShortId, {checklists:'all'}, function(card) {
        var arr = card.checklists.filter(function(e, i){return e['name'] == 'github';});
        var github;
        var issue;
        var outstanding = 1;

        if (arr.length >= 1)
          github = arr[0];
        else {
          outstanding++;
          Trello.post('/cards/' + card.id + '/checklists', {name:'github'}, function(checklist){
            github = checklist;
            if (--outstanding <= 0)
              addToChecklist(github, issue);
          }, function(){
            outstanding--;
            alert('trello api error');
          });
        }

        var repo = $('#github-repo').val();
        var title = $('#issue-title').val();
        var description = $('#issue-description').val() + '\n\n' + card.shortUrl;

        $.ajax({
          url:'https://api.github.com/repos/' + repo + '/issues',
          type:'POST',
          headers:{'Authorization':'token ' + githubKey},
          contentType:'application/json',
          data:JSON.stringify({
            title:title,
            body:description
          }),
          success:function(data, textStatus, jqXHR) {
            addToKnownRepos(repo);
            issue = data;
            if (--outstanding <= 0)
              addToChecklist(github, issue);
          },
          error:function(jqXHR, textStatus, errorThrown) {
            outstanding--;
            alert('github api error');
          }
        });
      }, function() {
        alert('trello api error');
      });
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
      $('.js-create-github-issue').click(createIssue);

      $('#github-repo').typeahead({
        source:JSON.parse(localStorage.getItem('knownRepos')),
        items:4
      });

      //validation
      $('#issue-title').blur(function(e){
        validate('#issue-title');
      });

      $('#github-repo').blur(function(e) {
        validate('#github-repo')
      });
    });
  }

  var validators = {
    '#github-repo':function(){
      var good = (/^[^\s\/]+\/[^\s\/]+$/.test($('#github-repo').val()));
      $('#github-repo').toggleClass('input-error', !good);
      return good;
    },
    '#issue-title':function(){
      var good =  $('#issue-title').val().length > 0;
      $('#issue-title').toggleClass('input-error', !good);
      return good;
    }
  };

  var validate = exports.validate = function(id) {
    var validator = validators[id];
    if (typeof validator !== 'function')
      return null;

    return validator();
  }

  setupPopover();
  githubAuth();

  return exports;
})(jQuery, Trello);

ob = new MutationObserver(function(objs, observer){
  var wasHidden = $.inArray('visibility: hidden', $.map(objs, function(o){return o['oldValue'];}).join().split(/;,? ?/)) != -1;
  if($('.window').is(':visible') && wasHidden) {
    trelloGithub.addButton();
  }
  if($('.window').is(':hidden'))
    $('#github-popover').hide();

});

//trigger ob's callback every time the style attribute on window changes
ob.observe($('.window')[0], {attributes:true, attributeFilter:['style'], attributeOldValue:true})
