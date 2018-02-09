// Generate and display the year at the footer
var year = moment().format('YYYY');
$("#year").text(year);

//=========================================
// Initialize Firebase
//=========================================

var config = {
    apiKey: "AIzaSyAFaSqCIFM1kntZUQY-fSCwtjylgadx414",
    authDomain: "project-1-7e8c4.firebaseapp.com",
    databaseURL: "https://project-1-7e8c4.firebaseio.com",
    storageBucket: "project-1-7e8c4.appspot.com"
};

firebase.initializeApp(config);

//=========================================
// VARIABLES
//=========================================

var storage = firebase.storage();
var database = firebase.database();
var categories = [];
var token;
var expire_at;
var faceApiKey = "TzPhp6T6gm-lmS0-R5Xpc-8AzCMt1T06";
var faceApiSKey = "0xJYV7chD3jy4fJlNEfPz05fbOjeUX1b";
var imageURL = '';
var emotionArr = []
var spotifyPlayList = []
var playLists = {
    happiness: "edm_dance",
    neutral: "chill",
    sadness: "jazz",
    disgust: "focus",
    anger: "rock",
    surprise: "mood",
    fear: "rnb"
}

//=================================================================
//  UPLOAD NAME AND IMAGE TO FIREBASE DATABASE AND FIREBASE STORAGE
//=================================================================
$("#submit-btn").on("click", function (event) {
    event.preventDefault();
    var nameInput = $("#name-input").val().trim();
    // Pass user input to validation function
    var validateKey = nameValidation(nameInput);
    var uploader = document.getElementById("fileToUpload");
    var file = uploader.files[0];
    var fileName = uploader.files[0].name;
    // Check if the form is empty or not
 

    if (nameInput != '' && file != null) {
        // Check if the inputs are valid inputs
        if (validateKey) {
            if (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
                // Create a storage ref
                var storageRef = storage.ref("images/" + file.name);
                $("#myModal").modal("show");
                //display modal text if form submitted
                var message = $("<h3>");
                message.text("Congratulations! Start listening soon...")
                var img = $("<img>");
                img.attr("src", "http://www.nizardamji.com/img/loader.gif");
                var loading = $("<h4>")
                loading.text("mixing up something great for you!")
                $(".modal-body").append(message,img,loading);
                // Upload file
                var task = storageRef.put(file).then(function (snapshot) {
                    // console.log("Done uploading");
                    // console.log(snapshot.downloadURL);
                    imageURL = snapshot.downloadURL;
                    // console.log(imageURL);

                    //===========================
                    //  FACE PLUS PLUS AJAX CALL
                    //===========================
                    $.ajax({
                        url: "https://api-us.faceplusplus.com/facepp/v3/detect",
                        method: "POST",
                        data: {
                            api_key: faceApiKey,
                            api_secret: faceApiSKey,
                            image_url: imageURL,
                            return_attributes: "age,emotion"
                        }
                    }).then(function (response) {
                        console.log(response, "response")
                        // console.log(response.faces[0].attributes.emotion);
                        // Get emotions to find out the highest value
                        var emotions = response.faces[0].attributes.emotion;
                        console.log("emotions",emotions)
                        sortResponse(emotions);
                        $("#myModal").modal("hide");
                    });

                    function sortResponse(emotion) {
                        // console.log("Hello", emotion);
                        for (var key in emotion) {
                            // emotionArr.push([key, emotion[key]]);
                            emotionArr.push({
                                emotion: key,
                                value: emotion[key]
                            })
                        }
                        // console.log(emotionArr);
                        // Sort Function
                        function sortNumber(a, b) {
                            return b.value - a.value;
                        }

                        emotionArr.sort(sortNumber);

                        console.log(emotionArr[0]);
                        // Save data into an object
                        var newUser = {
                            name: nameInput,
                            imageURL: imageURL,
                            emotion: emotionArr[0].emotion,
                            emotionValue: emotionArr[0].value
                        }
                        // Push newUser object to the firebase
                        database.ref().push(newUser);
                        // Empty the input form
                        $("#name-input").val("");
                        $("#fileToUpload").val(null);
                        
                        // Call display function to show return data on the HTML
                        display();
                        
                        // Call the playlist function to return the playlist related to input emotion
                        playList();
                    }
                });
            } else{
                // Show message to enter valid input
                $("#myModal").modal("show");
                $(".modal-body").html("Please use .jpg, .jpeg, or .png format for the photo!");
            }
        } else {
            // Show message to enter valid input
            $("#myModal").modal("show");
            $(".modal-body").html("Please use letters to enter your name!");
        }
    } else {
        // Show error message that you missed some inputs
        $("#myModal").modal("show");
        $(".modal-body").html("Please fill out the form!");
    }
    $("#name-input, #fileToUpload").val("");
});

//=========================================
// GENERATE SPOTIFY TOKEN EVERY ONE HOUR
//=========================================
// Run every one hour
setInterval(function () {
    myFunc()
}, 3600000)
// Spotify token generation
function myFunc() {
    $.ajax({
        url: "https://cors-anywhere.herokuapp.com/https://accounts.spotify.com/api/token",
        type: 'POST',
        headers: {
            "Authorization": "Basic MzIzZDEyY2M1MmJjNDViMThlMGQ5NmQwODcxYmE5ZDg6ZTRjNmM3MDEzMDIxNDFiMThlYmIyNzg1YjE2M2IwODY=",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: { 'grant_type': 'client_credentials' },
        success: function (result) {
            token = result.access_token
            expire_at = result.expires_in
        }
    });
}

// Call Spotify token generation function
myFunc()

//=========================================
// GET THE PLAYLIST FROM SPOTIFY API
//=========================================
function playList() {
    $.ajax({
        url: 'https://cors-anywhere.herokuapp.com/https://api.spotify.com/v1/browse/categories',
        method: 'GET',
        headers: { "Authorization": "Bearer " + token },
        success: function (result) {
            var newArr = result.categories.items
            spotifyPlayList = newArr
            // console.log(spotifyPlayList)
            // console.log(emotionArr[0].emotion);
            playLists[emotionArr[0].emotion];

            for (var i = 0; i < spotifyPlayList.length; i++) {
                if (spotifyPlayList[i].id == playLists[emotionArr[0].emotion]) {
                    console.log(spotifyPlayList[i].id);
                    // AJAX call to get the Spotify play list 
                    $.ajax({
                        url: "https://api.spotify.com/v1/browse/categories/" + spotifyPlayList[i].id + "/playlists",
                        method: "GET",
                        headers: { "Authorization": "Bearer " + token }
                    }).then(function (response) {
                        console.log(response);
                        var playlistID = response.playlists.items[0].id
                        console.log(playlistID);
                        // Display the playlist
                        var showPlaylist = $("<iframe>");
                        showPlaylist.attr({ id: "playlist", src: "https://open.spotify.com/embed?uri=spotify:user:spotify:playlist:" + playlistID, width: "300", height: "380", frameborder: "0", allowtransparency: "true" });
                        $("#main-content").append(showPlaylist);
                    });
                }
            }
        },
        error: function (error) {
            console.log(error);
        }
    });
}


// DISPLAY FUNCTION
function display() {
    console.log("test")
    // Empty this section
    $("#main-content").empty();
    // Connect to firebase and get the last input
    database.ref().orderByChild("dateAdded").limitToLast(1).on("child_added", function (snapshot) {
        // console.log(snapshot.val());
        // Get these information from the last input from the firebase
        var name = snapshot.val().name;
        var image = snapshot.val().imageURL;
        var emotion = snapshot.val().emotion;
        var emotionValue = snapshot.val().emotionValue;
        // Display these information on the HTML
        $("#main-content").append("<ul><li><img width='200' height='200' src=" + imageURL + "/></li><li>Hi " + name + "!</li><li><p>You are " + emotionValue + "% " + emotion + ". We recomend you to listen to:</P></li></ul>");
    });
}


// Name validation function
function nameValidation(strValue) {
    // console.log("Validation function");
    var objRegExp = /^[a-zA-Z ]+$/;
    return objRegExp.test(strValue);
}

