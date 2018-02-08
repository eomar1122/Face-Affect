/*Spotify API Key

      Client ID: 323d12cc52bc45b18e0d96d0871ba9d8

      Client Secret: e4c6c701302141b18ebb2785b163b086
      encoded key: MzIzZDEyY2M1MmJjNDViMThlMGQ5NmQwODcxYmE5ZDg6ZTRjNmM3MDEzMDIxNDFiMThlYmIyNzg1YjE2M2IwODY= */

/*Face++ API Key

API Key
TzPhp6T6gm-lmS0-R5Xpc-8AzCMt1T06

API Secret
0xJYV7chD3jy4fJlNEfPz05fbOjeUX1b*/
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
var sadness = [];
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
// Get elements documents 
$("#submit-btn").on("click", function (event) {
    event.preventDefault();
    var nameInput = $("#name-input").val().trim();
    var uploader = document.getElementById("fileToUpload");
    var file = uploader.files[0];
    if (nameInput != '' && file != null) {

    	//display modal
    	$('#myModal').modal('show');
    	//display modal text if form submitted
    	$(".modal-body").html("Congratulations! Start listening now...");
        // Create a storage ref
        var storageRef = storage.ref("images/" + file.name);

        // Upload file
        var task = storageRef.put(file).then(function (snapshot) {
            // console.log("Done uploading");
            // console.log(snapshot.downloadURL);
            imageURL = snapshot.downloadURL;
            // console.log(imageURL);

            //=================================================================
            //  FACE PLUS PLUS AJAX CALL
            //=================================================================

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
                // console.log(response.faces[0].attributes.emotion);
                var emotions = response.faces[0].attributes.emotion;
                sortResponse(emotions);
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
                console.log(emotionArr);
                function sortNumber(a, b) {
                    return b.value - a.value;
                }

                emotionArr.sort(sortNumber);

                console.log(emotionArr[0]);




                var newUser = {
                    name: nameInput,
                    imageURL: imageURL,
                    emotion: emotionArr[0].emotion,
                    emotionValue: emotionArr[0].value
                }

                database.ref().push(newUser);
                // set user child (where the user name and image is at) add the emtions defualyEmotion: emotionArr[0] & backupEmotion: emotionArr[1]
                $("#name-input").val("");
                $("#fileToUpload").val(null);

                display();

                playList();

            }


        });
        // console.log("Image uploaded");

    } else {
       $('#myModal').modal('show');
       $(".modal-body").html("Please fill out the form!");
    }

});


//=========================================
// GENERATE SPOTIFY TOKEN EVERY ONE HOUR
//=========================================

setInterval(function () {
    myFunc()
}, 3600000)

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
            // return a access token
            // console.log(result.access_token)
            token = result.access_token
            expire_at = result.expires_in
            // console.log(token);
            // console.log(expire_at);
            // Creates local "temporary" object for holding token data
            // var newToken = {
            //   tokenName: token,
            //   value: expire_at
            // };
            //   // Upload token data to the firebase database
            //   database.ref().set(newToken);
        }
    });
}

myFunc()



//=========================================
// GET THE PLAYLIST FROM SPOTIFY API
//=========================================
function playList() {

    // database.ref().on("value", function(childSnapshot) {
    //   var token = childSnapshot.val().tokenName;
    //   var name = childSnapshot.val().name;
    // console.log(name);
    // console.log(childSnapshot.val());
    // console.log("hi " + token);

    $.ajax({
        url: 'https://cors-anywhere.herokuapp.com/https://api.spotify.com/v1/browse/categories',
        method: 'GET',
        headers: { "Authorization": "Bearer " + token },
        success: function (result) {
            var newArr = result.categories.items

            spotifyPlayList = newArr

            console.log(spotifyPlayList)
            console.log(emotionArr[0].emotion);

            playLists[emotionArr[0].emotion];

            for (var i = 0; i < spotifyPlayList.length; i++) {
                if (spotifyPlayList[i].id == playLists[emotionArr[0].emotion]) {
                    console.log(spotifyPlayList[i].id);
                    $.ajax({
                        url: "https://api.spotify.com/v1/browse/categories/" + spotifyPlayList[i].id + "/playlists",
                        method: "GET",
                        headers: { "Authorization": "Bearer " + token }
                    }).then(function (response) {
                        console.log(response);
                        var playlistID = response.playlists.items[0].id
                        console.log(playlistID);
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
    })
    // });
}

function display() {
    $("#main-content").empty();
   database.ref().orderByChild("dateAdded").limitToLast(1).on("child_added", function(snapshot) {
    console.log(snapshot.val());
    var name = snapshot.val().name;
    var image = snapshot.val().imageURL;
    var emotion = snapshot.val().emotion;
    var emotionValue = snapshot.val().emotionValue;

    $("#main-content").append("<ul><li>Your name: " + name + "</li><li><img width='200' height='200' src=" + imageURL + "/></li><li><p>You are " + emotionValue + "% " +  emotion + ". We recomend you to listen to.</P></li></ul>");
  });
}


// Add name validation function

// Letters validation function
function validate(strValue) {
    // console.log("Validation function");
    var objRegExp = /^[a-zA-Z ]+$/;
    return objRegExp.test(strValue);
}

// Add uploader validation function
