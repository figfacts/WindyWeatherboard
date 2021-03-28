$(function () {
  //VARIABLES
  //===========================================================================
  var numberOfDaysToForecast = 5;
  var searchHistoryArray = [];
  var apiKey = "a75fc96e0e608438da50e325f4bf1c12";
  var inputField = $("#city-input");
  var cityName;
  var todaysDate = moment().format('L');   
  var inputSwitch; //refer to line 73 for definition
  var listCity;
  if (localStorage.getItem("Weather search history")) {
    var arrayFromLocalStorage = localStorage
      .getItem("Weather search history")
      .split(",");
  } else {
    var arrayFromLocalStorage;
  }
  // ===========================================================================

  //EVENT LISTENERS
    
  //listen for the  search button
  $("#search-btn").on("click", function () {
    event.preventDefault();

    if (inputField.val() === "" || inputField.val() === "undefined" ) {
      //if blank, add a city name 
    alert("Please enter a city name.")  //added the alert 
    } else {
      inputSwitch = true;
      showWeather();
    }
  });

  //listen for the clear button
  $("#clear-btn").on("click", function () {
  //   console.log("clear");
    localStorage.removeItem("Weather search history");
    location.reload();
  });

  //listen to the items in the left search history sidebar
  $(document).on("click", "list-group-item", function () {
    inputSwitch = false;
    listCity = $(this).text(); // this holds the element originally requested
    showWeather(); 
  });
  // ===========================================================================

  //FUNCTIONS
  

  //When the page loads, it will check local storage and display any search history
  function onLoad() {
    $("#search-history-items").empty();

    if (arrayFromLocalStorage) {
      searchHistoryArray = arrayFromLocalStorage;
    }

    for (let i = 0; i < searchHistoryArray.length; i++) {
      var searchList = $("<li>").text(searchHistoryArray[i]);
      searchList.addClass("list-group-item");
      $("#search-history-items").prepend(searchList);
    }
  }
  onLoad();

  function showWeather() {
    event.preventDefault();

    // The Input switch tells the program whether the user is typing in a new a search term  or clicking on one of the previous search history cities. The search term will be used in the currentWeatherQueryURL
    if (inputSwitch) {
      cityName = inputField.val();
    } else {
      cityName = listCity;
    }

    $("#header-row").empty();
    $("#current-weather-data").empty();
    $("#forecast-row").empty();

    var currentWeatherQueryURL =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      cityName +
      "&units=imperial&appid=" +
      apiKey;

    //API Calls begin
      $.ajax({
      url: currentWeatherQueryURL,
      method: "GET",
    }).then(function (response) {
      //Now that we've got a response, change the cityName from whatever the user typed in to what the API actually returns as the "name"
      cityName = response.name;

    
      // Check if city name is valid 
      if (response) {
        if (searchHistoryArray.includes(cityName) === false) {
          //if city name is not present in the array
          populateSearchBar();
        }
      } else {
          
         alert("Please enter a valid city name.");
          
      }
      //If the validation checks out then, continue. 

      //Display header showing City, Date, and Icon
      cityNameAndDate = $("<h4>").text(response.name + " (" + todaysDate + ")");
      currentWeatherIconEl = $("<img id='current-weather-icon'>").attr(
        "src",
        "https://openweathermap.org/img/wn/" + response.weather[0].icon + ".png"
      );
      $("#header-row").append(cityNameAndDate, currentWeatherIconEl);

      //Display current weather data on dashboard
      currentTempEl = $("<p>").text(
        "Temperature: " + Math.round(response.main.temp) + " °F"
      );
      currentHumidityEl = $("<p>").text(
        "Humidity: " + response.main.humidity + "%"
      );
      currentWindEl = $("<p>").text(
        "Wind speed: " + Math.round(response.wind.speed) + " MPH"
      );
      //append them all together
      $("#current-weather-data").append(
        currentTempEl,
        currentHumidityEl,
        currentWindEl
      );

      //Grabbing variables with which to call for the UV index
      var latitude = response.coord.lat;
      var longitude = response.coord.lon;

      //current UV index API Call
      var currentUVQueryURL =
        "https://api.openweathermap.org/data/2.5/uvi?appid=" +
        apiKey +
        "&lat=" +
        latitude +
        "&lon=" +
        longitude;

      $.ajax({
        url: currentUVQueryURL,
        method: "GET",
      }).then(function (response) {
        

        currentUVLabel = $("<span>").text("UV Index: ");
        currentUVBadge = $("<span>").text(response.value);
        console.log(response.value);
        //apply UV colors
        if (response.value < 3) {
          // green
          currentUVBadge.addClass("uv uv-low");
        } else if (response.value >= 3 && response.value < 6) {
          //yellow
          currentUVBadge.addClass("uv uv-med");
        } else if (response.value >= 6 && response.value < 8) {
          //orange
          currentUVBadge.addClass("uv uv-high");
        } else if (response.value >= 8 && response.value <= 10) {
          //red
          currentUVBadge.addClass("uv uv-very-high");
        } else {
          //purple
          currentUVBadge.addClass("uv uv-extreme");
        }

        $("#current-weather-data").append(currentUVLabel, currentUVBadge);
      });

      //Forecast call
      var forecastQueryURL =
        "https://api.openweathermap.org/data/2.5/onecall?units=imperial&lat=" +
        latitude +
        "&lon=" +
        longitude +
        "&exclude=current,minutely,hourly&appid=" +
        apiKey;

      $.ajax({
        url: forecastQueryURL,
        method: "GET",
      }).then(function (response) {
        $("#forecast-title").text("5-day Forecast");
        //Loop to create forecast cards...the loop starts on index 1 because 0 is today's weather
        for (let i = 1; i < numberOfDaysToForecast + 1; i++) {
          //create a card
          var forecastCard = $("<div class='card forecast card-body'>");

          //title of card: day of the week
          var forecastDayEl = $("<h5>");
          //fetch unix timestamp and convert to day of the week
          var unixSeconds = response.daily[i].dt;
          var unixMilliseconds = unixSeconds * 1000;
          var forecastDateUnix = new Date(unixMilliseconds);           
          var forecastDoW = forecastDateUnix.toLocaleString("en-US");
          forecastDayEl.text(forecastDoW);

          // create hr
          var hrLine = $("<hr />");

          // create p to hold icon
          var iconParagraph = $("<p>");
          //create icon and append to p
          var iconImg = $("<img>");
          iconImg.attr(
            "src",
            "http://openweathermap.org/img/wn/" +
              response.daily[i].weather[0].icon +
              ".png"
          );
          iconParagraph.append(iconImg);

          //create P to hold temp
          var tempParagraph = $("<p>").text(
            "Temp: " + Math.round(response.daily[i].temp.day) + " °F"
          );

          //create p to hold humidity
          var humidParagraph = $("<p>").text(
            "Humidity: " + response.daily[i].humidity + "%"
          );

          //append it all together
          forecastCard.append(
            forecastDayEl,
            hrLine, //just a line
            iconParagraph,
            tempParagraph,
            humidParagraph
          );
          $("#forecast-row").append(forecastCard);
        }
      });
      // end of forecast call
    });
  }
  function populateSearchBar() {
    $("#search-history-items").empty();

    searchHistoryArray.push(cityName);
  //   console.log("searchHistoryArray: " + searchHistoryArray);
    localStorage.setItem("Weather search history", searchHistoryArray);

    for (let i = 0; i < searchHistoryArray.length; i++) {
      var searchList = $("<li>").text(searchHistoryArray[i]);
      searchList.addClass("list-group-item");
      $("#search-history-items").prepend(searchList);
    }
  }
});