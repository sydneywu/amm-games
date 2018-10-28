(function() {

  var wheelIframeUrl = "http://localhost:8080/wheel/circle2"
  var prizeConfig = [
    {
      "id": 1,
      "prizeType": 1,
      "code": "T-shirt",
      "winRate": 0.25,
      "maxRewardable": 10,
      "requireStockAvailable": false
    },
    {
      "id": 2,
      "prizeType": 1,
      "code": "Evoucher",
      "winRate": 0.25,
      "maxRewardable": 10,
      "requireStockAvailable": false
    },
    {
      "id": 3,
      "prizeType": 2,
      "code": "Food",
      "winRate": 0.25,
      "maxRewardable": 10,
      "requireStockAvailable": false
    },
    {
      "id": 4,
      "prizeType": 3,
      "code": "Books",
      "winRate": 0.25,
      "maxRewardable": 10,
      "requireStockAvailable": false
    }
  ]

  var iframeContainer = $("#iframe-container");
  var selectContainer = $("#select-container");
  var infoContainer = $("#info-container");
  var gameSelect = $("#game-select");
  var playBtn = $("#play-btn");

  
  function main(){
    infoContainer.addClass("d-none");

    // listen for message pass from iframe
    window.addEventListener('message', (msg)=>{
      console.log('spin ended', msg);
      iframeContainer.addClass("d-none")
    })

    gameSelect.change(function(){
      var value = $(this).val();
      if(value === "wheel") infoContainer.removeClass("d-none");
    })

    playBtn.click(function(){
      loadWheelGame()
      selectContainer.addClass("d-none")
      infoContainer.addClass("d-none");
      iframeContainer.removeClass("d-none")
    })
  }

  function loadWheelGame(){

    var wheelSlices = formatPrizeForToWheelSlices(prizeConfig)

    let dataSrc = {
      slices: wheelSlices,
      wheelRounds: 4,
      winId: 2,
      winMessage: "Congratulations! You won Evoucher"
    }

    var iframe = createIframe(dataSrc)

    iframeContainer[0].appendChild(iframe);
  }


  function createIframe(data){
    var iframe = document.createElement('iframe');

    var dataString = JSON.stringify(data);
    var iframeSource = wheelIframeUrl + "?data=" + dataString;
    iframe.setAttribute('src', iframeSource);
    iframe.setAttribute('id', 'the_iframe');
    iframe.setAttribute('width', 1000);
    iframe.setAttribute('height', 600);
    iframe.setAttribute('frameBorder', 0);
    return iframe
  }

  function formatPrizeForToWheelSlices(prizes){
    var slices = [];
    var totalProbability = findTotalProbability(prizes)

    prizes.forEach((prize,i)=>{
      var prize = {
          id: prize.id,
          degrees: prize.winRate/totalProbability * 360,
          text: prize.code
      }
      slices.push(prize);
    })

    return slices;
  }

  function findTotalProbability(prizes){
    return prizes.reduce((acc , curr)=> (acc + curr.winRate), 0)
  }

  main();

})();
