console.log("let's play with javascript");

let currentSong = new Audio();
let songUl;
let currFolder;
let songs = [];

// Seconds to minute seconds conversion
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;

  let b = await fetch(`http://127.0.0.1:5500/${currFolder}/`);
  let response = await b.text();

  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");

  songs = [];
  for (let i = 0; i < as.length; i++) {
    const element = as[i];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${currFolder}/`)[1]);
    }
  }

  songUl = document.querySelector(".songList").getElementsByTagName("ul")[0];
  songUl.innerHTML = "";
  for (const song of songs) {
    songUl.innerHTML += `
      <li>
        <img class="invert" src="Images/music.svg" alt="">
        <div class="info">
            <div>${song.replaceAll("%20", " ")}</div>
        </div>
        <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="Images/playsong.svg" alt="">
        </div>
      </li>`;
  }

  Array.from(
    document.querySelector(".songList").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", () => {
      playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
    });
  });

  return songs;
}

async function displayAlbums() {
  // Fetch the directory listing of songs
  let response = await fetch(`http://127.0.0.1:5500/songs/`);
  let htmlContent = await response.text();
  console.log(htmlContent);

  // Create a temporary div to parse the HTML content
  let div = document.createElement("div");
  div.innerHTML = htmlContent;

  // Get all the album links from the directory
  let anchors = div.getElementsByTagName("a");
  console.log(anchors);
  let cardContainer = document.querySelector(".card-container");

  let array = Array.from(anchors);
//   console.log(array);
//   console.log(
//     "................................................................"
//   );
  for (let i = 0; i < array.length; i++) {
    const e = array[i];

    // console.log("Highlight", e.href);

    // Check if the link is to a directory (album)
    if (e.href.includes("/songs")) {
      let folder = e.href.split("/").slice(-1)[0]; // Get folder name
    //   console.log("Folder:", folder);

      try {
        // Fetch album info from the info.json file inside the folder
        let albumInfoResponse = await fetch(
          `http://127.0.0.1:5500/songs/${folder}/info.json`
        );
        let albumInfo = await albumInfoResponse.json();

        // Create and append the album card to the container
        cardContainer.innerHTML += `
            <div data-folder="${folder}" class="card">
              <div class="play"><img src="Images/playbtn.svg" alt="Play Button"></div>
              <img src="/songs/${folder}/cover.jpg" alt="Cover image of ${albumInfo.title}">
              <h4>${albumInfo.title}</h4>
              <p class="p">${albumInfo.description}</p>
            </div>`;
      } catch (error) {
        console.error(`Error fetching info for album "${folder}":`, error);
      }
    }
  }

  // Add click event listener to each album card
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      let folder = item.currentTarget.dataset.folder;
      console.log(`Loading playlist for album: ${folder}`);

      try {
        // Fetch the songs for the selected album
        let songs = await getSongs(`songs/${folder}`);
        // Play the first song
        playMusic(songs[0]);
      } catch (error) {
        console.error(`Error loading songs for album "${folder}":`, error);
      }
    });
  });
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;
  if (!pause) {
    currentSong.play();
    play.src = "Images/pause.svg";
  }

  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function main() {
  await getSongs("songs/ncs");
  playMusic(songs[0], true);
  displayAlbums();

  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "Images/pause.svg";
    } else {
      currentSong.pause();
      play.src = "Images/playsong.svg";
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;

    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let timepercent =
      (e.offsetX / e.target.getBoundingClientRect().width) * 100;

    document.querySelector(".circle").style.left =
      (e.offsetX / e.target.getBoundingClientRect().width) * 100 + "%";

    currentSong.currentTime = (currentSong.duration * timepercent) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = 0;
    document.querySelector(".left").style.transition = "all 0.8s ease-out";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  previous.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) playMusic(songs[index - 1]);
  });

  next.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) playMusic(songs[index + 1]);
  });

  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      currentSong.volume = parseInt(e.target.value) / 100;
      if (currentSong.volume > 0) {
        document.querySelector(".volume img").src = document
          .querySelector(".volume img")
          .src.replace("mute.svg", "volume.svg");
      }
    });

  document.querySelector(".volume img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 0;
      currentSong.volume = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 0.1;
    }
  });

  document.querySelector(".volume").addEventListener("mouseover", () => {
    document.querySelector(".range").classList.remove("hide");
  });

  document.querySelector(".volume").addEventListener("mouseout", () => {
    setTimeout(() => {
      document.querySelector(".range").classList.add("hide");
    }, 6000);
  });
}

main();
