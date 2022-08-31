// Get reference to HTML elements
const previewContainerEl = document.querySelector("#previewContainer");
const selectDevices = document.querySelector("#select-devices");
const videoChat = document.querySelector("#video-chat");
const audioSelector = document.querySelector("#audio-source-select");
const videoSelector = document.querySelector("#video-source-select");
const previewSelectionBtn = document.querySelector("#previewSelection");
const requestAccessBtn = document.querySelector("#requestAccess");
const permissionDeniedEl = document.querySelector("#permissionDenied");
const joinRoomBtn = document.querySelector("#joinRoomButton");
const veContainerEl = document.querySelector("#VEcontainer");
const videoBtn = document.querySelector("#videoButton");
const audioBtn = document.querySelector("#audioButton");
// const videoStatusEl = document.querySelector("#videoStatus");

// const audioStatusEl = document.querySelector("#audioStatus");
const layoutBtn = document.querySelector("#layoutButton");
// const layoutStatusEl = document.querySelector("#layoutStatus");
const screenshareStartBtn = document.querySelector("#screenshareStartButton");
const screenshareStopBtn = document.querySelector("#screenshareStopButton");
const leaveBtn = document.querySelector("#leaveButton");
const myPreviewVideoEl = document.querySelector("#myPreviewVideo");
const myVideoText = document.querySelector(".myVideo");
const myScreeenshareText = document.querySelector(".screenshare");
const controlsContainer = document.querySelector(".controls");
const layoutContainer = document.querySelector(".layout");
const idLabel = document.querySelector(".bottomRightContainer-0-0-8");
const userName = document.querySelector("#userName");
const viewerOnly = document.querySelector("#viewerOnly");
const participantName = document.querySelector(".participant-name");

// Layout elements
const gridSelect = document.querySelector("#grid");
const speakerSelect = document.querySelector("#speaker");

// Set video container and controls hidden to start the app
veContainerEl.style.display = "none";
controlsContainer.style.display = "none";
layoutContainer.style.display = "none";

// Instantiate the global variables
let previewPublisher;
let room;

// Checking to see how many media devices are supported and listing them in a dropdown menu
const loadAVSources = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    stream.getTracks().forEach((track) => track.stop());
    let audioCount = 0;
    let videoCount = 0;
    const devices = await VideoExpress.getDevices();
    devices.forEach(function (device) {
      if (device.kind.toLowerCase() === "audioinput") {
        audioCount += 1;
        audioSelector.innerHTML += `<option value="${device.deviceId}">${
          device.label || device.kind + audioCount
        }</option>`;
      }
      if (device.kind.toLowerCase() === "videoinput") {
        videoCount += 1;
        videoSelector.innerHTML += `<option value="${device.deviceId}">${
          device.label || device.kind + videoCount
        }</option>`;
      }
    });
    audioSelector.innerHTML += `<option value="">No audio</option>`;
    videoSelector.innerHTML += `<option value="">No video</option>`;
  } catch (error) {
    console.error("error loading AV sources: ", error);
  }
};

loadAVSources();

requestAccessBtn.addEventListener("click", () => {
  permissionDeniedEl.style.display = "none";
  loadAVSources();
});

const startPreview = () => {
  myPreviewVideoEl.innerHTML = "";
  previewPublisher = new VideoExpress.PreviewPublisher("previewContainer");
  previewPublisher.previewMedia({
    targetElement: "myPreviewVideo",
    publisherProperties: {
      resolution: "1280x720",
      [audioSelector.value === "" ? "publishAudio" : "audioSource"]:
        audioSelector.value === "" ? false : audioSelector.value,
      [videoSelector.value === "" ? "publishVideo" : "videoSource"]:
        videoSelector.value === "" ? false : videoSelector.value,
      mirror: false,
      audioBitrate: 15,
      audioFallbackEnabled: true,
    },
  });
};

previewSelectionBtn.addEventListener("click", () => {
  startPreview();
  joinRoomBtn.disabled = false;
});

// Join room event listener - when clicked join the room

joinRoomBtn.addEventListener("click", () => {
  previewPublisher.destroy();
  layoutContainer.style.display = "flex";
  controlsContainer.style.display = "flex";
  previewContainerEl.style.display = "none";
  veContainerEl.style.display = "block";
  const isViewerOnly = viewerOnly.checked;
  const name = userName.value;
  joinRoom(name, isViewerOnly);
});

// When joining room, create a new room object

const joinRoom = async (name, isViewerOnly) => {
  if (!room) {
    room = new VideoExpress.Room({
      apiKey: apiKey, // add your OpenTok APIKey
      sessionId: sessionId, // add your OpenTok Session Id
      token: token, // add your OpenTok token
      roomContainer: "roomContainer",
      managedLayoutOptions: {
        cameraPublisherContainer: "myVideo",
      },
      participantName: name,
      // maxVideoParticipantsOnScreen: 2,   Can adjust this if necessary
    });
  }

  const { camera, screen } = room; //desctructure room object into camera and screen

  try {
    await room.join({
      publisherProperties: {
        resolution: "1280x720",
        [audioSelector.value === "" ? "publishAudio" : "audioSource"]:
          audioSelector.value === "" ? false : audioSelector.value,
        [videoSelector.value === "" ? "publishVideo" : "videoSource"]:
          videoSelector.value === "" ? false : videoSelector.value,
        mirror: false,
        // height: "600px", // Can access the publishers video props through here. Make smaller or larger if you want
        // width: "600px",
        audioBitrate: 15,
        audioFallbackEnabled: true,
      },
    });
  } catch (error) {
    console.error("Error joining room: ", error);
  }

  // Add/remove disabled class on audio and video if disabled!
  if (!camera.isVideoEnabled()) videoBtn.classList.add("off");
  if (!camera.isAudioEnabled()) audioBtn.classList.add("off");
  if (camera.isVideoEnabled()) videoBtn.classList.remove("off");
  if (camera.isAudioEnabled()) audioBtn.classList.remove("off");

  // Set the layout highlighted to Grid layout (the default)
  gridSelect.classList.add("active");
  speakerSelect.classList.remove("active");

  // Toggle video
  const toggleVideo = () => {
    console.log("camera.isVideoEnabled()", camera.isVideoEnabled());
    if (camera.isVideoEnabled()) {
      camera.disableVideo();
      console.log(camera);
      console.log(screen);
      videoBtn.classList.add("off");
    } else {
      camera.enableVideo();
      videoBtn.classList.remove("off");
    }
  };

  videoBtn.addEventListener("click", toggleVideo, false);

  // Toggle audio
  const toggleAudio = () => {
    console.log("camera.isAudioEnabled()", camera.isAudioEnabled());
    if (camera.isAudioEnabled()) {
      camera.disableAudio();
      audioBtn.classList.add("off");
    } else {
      camera.enableAudio();
      audioBtn.classList.remove("off");
    }
  };

  audioBtn.addEventListener("click", toggleAudio, false);

  //Toggle layout
  const gridLayout = () => {
    room.setLayoutMode("grid");
    gridSelect.classList.add("active");
    speakerSelect.classList.remove("active");
    layoutBtn.textContent = "Grid";
  };

  const speakerLayout = () => {
    room.setLayoutMode("active-speaker");
    gridSelect.classList.remove("active");
    speakerSelect.classList.add("active");
    layoutBtn.textContent = "Active Speaker";
  };

  gridSelect.addEventListener("click", gridLayout, false);
  speakerSelect.addEventListener("click", speakerLayout, false);

  console.log(room);

  // Screensharing functionality
  const startScreensharing = () => {
    room.startScreensharing("myScreenshare");
    screenshareStartBtn.style.display = "none";
    screenshareStopBtn.style.display = "block";
  };

  const stopScreensharing = () => {
    room.stopScreensharing();
    screenshareStopBtn.style.display = "none";
    screenshareStartBtn.style.display = "block";
  };

  screenshareStartBtn.addEventListener("click", startScreensharing, false);
  screenshareStopBtn.addEventListener("click", stopScreensharing, false);

  leaveBtn.addEventListener("click", () => {
    // Remove all the event listeners
    screenshareStartBtn.removeEventListener("click", startScreensharing, false);
    screenshareStopBtn.removeEventListener("click", stopScreensharing, false);
    videoBtn.removeEventListener("click", toggleVideo, false);
    audioBtn.removeEventListener("click", toggleAudio, false);
    gridSelect.removeEventListener("click", gridLayout, false);
    speakerSelect.removeEventListener("click", speakerSelect, false);

    // Leave the room
    room.leave();

    //Display the preview container and hide the rest
    previewContainerEl.style.display = "flex";
    veContainerEl.style.display = "none";
    controlsContainer.style.display = "none";
    layoutContainer.style.display = "none";
    startPreview();
  });

  // If you are viewer ONLY (Can't figure out how to make it so you don't appear as a participant on other users subscriber screen - may be a setting vonage won't allow)
  if (isViewerOnly) {
    // Deactivate the event listeners (except layout manager)
    screenshareStartBtn.removeEventListener("click", startScreensharing, false);
    screenshareStopBtn.removeEventListener("click", stopScreensharing, false);
    videoBtn.removeEventListener("click", toggleVideo, false);
    audioBtn.removeEventListener("click", toggleAudio, false);

    camera.destroyCameraPublisher();
    // camera.disableAudio();
    // camera.disableVideo();

    if (!camera.isVideoEnabled()) videoBtn.classList.add("off");
    if (!camera.isAudioEnabled()) audioBtn.classList.add("off");
    console.log(screen.isVideoEnabled());
    console.log(room);
  }

  screen.on("started", () => {
    console.log("The screen sharing has started!");
    screenshareStartBtn.style.display = "none";
    screenshareStopBtn.style.display = "block";
  });

  screen.on("stopped", () => {
    console.log("The screen stopped sharing because: ");
    screenshareStopBtn.style.display = "none";
    screenshareStartBtn.style.display = "block";
  });

  room.on("connected", async () => {
    console.log("room connected!");
  });

  // The following are events you might want to listen for
  room.on("participantJoined", (participant) => {
    console.log("participantJoined: ", participant);

    room.on("participantLeft", (participant) => {
      console.log("participantLeft: ", participant);
    });

    participant.on("cameraCreated", (cameraSubscriber) => {
      console.log("Participant camera created! ", cameraSubscriber);
    });

    participant.on("screenCreated", (screenSubscriber) => {
      console.log(screenSubscriber);
    });

    participant.on("screenDestroyed", (reason) => {
      console.log("Paricipant Screen destroyed!", reason);
    });

    participant.on("destroyed", (reason) => {
      console.log("Paricipant Screen destroyed!", reason);
    });

    participant.on("cameraDestroyed", (reason) => {
      console.log("Participant camera destroyed!", reason);
    });
  });

  // more events to listen for
  room.on("disconnected", () => {
    console.log("room disconnected!");
  });
  room.on("reconnecting", () => {
    console.log("room reconnecting!");
  });
  room.on("reconnected", () => {
    console.log("room reconnected!");
  });
};
