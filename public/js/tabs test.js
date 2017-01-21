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
        <li class="active"><a href="#home">Circuit</a></li>
        <li><a href="#profile">Circuit2</a></li>
        <li><a href="#messages">Circuit3</a></li>
        <li><a href="#settings">Circuit4</a></li>
      </ul>

      <!-- Tab panes -->
      <div class="tab-content">
        <div class="tab-pane active" id="Circuit1">Circuit1 Panel</div>
        <div class="tab-pane" id="Circuit2">Circuit2 Panel</div>
        <div class="tab-pane" id="Circuit3">Circuit3 Panel</div>
        <div class="tab-pane" id="Circuit4">Circuit4 Panel</div>
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