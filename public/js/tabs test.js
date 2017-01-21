<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Tabs</title>
    <style>
      .nav .active a { color: red; }
      .tab-pane { display: none; }
      .tab-pane.active { display: block; }
    </style>
  </head>
  
  <body>

    <div>
      <!-- Tabs -->
      <ul id="nav-tab" class="nav">
        <li class="active"><a href="#home">Home</a></li>
        <li><a href="#profile">Profile</a></li>
        <li><a href="#messages">Messages</a></li>
        <li><a href="#settings">Settings</a></li>
      </ul>

      <!-- Tab panes -->
      <div class="tab-content">
        <div class="tab-pane active" id="home">Home Panel</div>
        <div class="tab-pane" id="profile">Profile Panel</div>
        <div class="tab-pane" id="messages">Messages Panel</div>
        <div class="tab-pane" id="settings">Settings Panel</div>
      </div>
    </div>
    
    <footer>
      <script type="text/javascript">
        (function(){
          function onTabClick(event){
            var actives = document.querySelectorAll('.active');

            // deactivate existing active tab and panel
            for (var i=0; i < actives.length; i++){
              actives[i].className = actives[i].className.replace('active', '');
            }

            // activate new tab and panel
            event.target.parentElement.className += ' active';
            document.getElementById(event.target.href.split('#')[1]).className += ' active';
          }

          var el = document.getElementById('nav-tab');

          el.addEventListener('click', onTabClick, false);
        })();
      </script>
    </footer>

  </body>
</html>