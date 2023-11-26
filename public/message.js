document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"><\/script>');
var username = "";
var myname = "";
var timer = null;
var keys;

let backgroundColor, textColor, ballColor, racketColor;
let gameScreen;

let gravity = 0.3;
let airfriction = 0.00001;
let friction = 0.1;

let score = 0;
let likeCount = 0;
let maxHealth = 100;
let health = 100;
let healthDecrease = 25;
let healthBarWidth = 60;

let ballX, ballY;
let ballSpeedVert = 0;
let ballSpeedHorizon = 0;
let ballSize = 20;

let racketWidth = 100;
let racketHeight = 10;

function setup() {
    frameRate(60);
    createCanvas(1600, 800);
    ballX = width / 4;
    ballY = height / 5;

    backgroundColor = color(34, 34, 34);
    textColor = color(255);
    ballColor = color('#FF9900');
    racketColor = color('#0081FF');
    gameScreen = 0;

    //Show 
    showLoginForm();
}

function showLoginForm() {
    document.getElementById('loginform').style.display = 'flex';
}

function draw() {
    noCursor();
    if (gameScreen == 0) {
        initScreen();
    } else if (gameScreen == 1) {
        gameScreenFunction();
    } else if (gameScreen == 2) {
        // sendScoreToServer();
        gameOverScreen();
    }
}

function initScreen() {
    background(0);
    textAlign(CENTER);
    fill(textColor);
    textSize(70);
    text("Ball Bouncing", width / 2, height / 2);
    textSize(24);
    text("Press Enter to start", width / 2, height - 50);
}

function gameScreenFunction() {
    background(backgroundColor);
    drawRacket();
    watchRacketBounce();
    drawBall();
    applyGravity();
    applyHorizontalSpeed();
    keepInScreen();
    drawHealthBar();
    printScore();
}

function gameOverScreen() {
    background(0);
    textAlign(CENTER);
    fill(textColor);
    textSize(70);
    text("Game Over", width / 2, height / 2 - 120);
    textSize(24);
    text("Your Score:", width / 2, height / 2);
    textSize(60);
    text(score, width / 2, height / 2 + 60);
    textSize(24);
    text("Press Enter to restart", width / 2, height - 50);
}
window.onload = pageLoad;

function pageLoad() {
    getData();
    setUsername();
    
	document.getElementById('displayPic').onclick = fileUpload;
	document.getElementById('fileField').onchange = fileSubmit;

    var x = document.getElementById("submitmsg");
	x.onclick = sendMsg;

    showImg('img/'+getCookie('img'));
}
function showImg(filename){
	if (filename !==""){
		var showpic = document.getElementById('displayPic');
		showpic.innerHTML = "";
		var temp = document.createElement("img");
		temp.src = filename;
		showpic.appendChild(temp);
	}
}
function fileUpload(){
	document.getElementById('fileField').click();
}

function fileSubmit(){
	document.getElementById('formId').submit();
}
// getData();
async function sendScoreToServer() {
    // Get the score from the input field
    const Nscore = score;
    const Numlike = 0;
    if (score == 0){
        return ;
    }

    try {
        // const response = await fetch("/submitScore", {
        //     method: "POST",
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ score: score }), // Send the score in the request body
        // });
        const response = await fetch("http://localhost:3000/submitScore", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ score: score,
                user: username,
                nlike: Numlike,}), // Send the score in the request body
        });
        await getData();

        // Handle the response if needed
    } catch (error) {
        console.error('Error submitting score:', error);
        // Handle the error if needed
    }
}
async function sendLikeToServer(username, likeCount) {
    myname = getCookie('username');
    try {
        const response = await fetch("/submitLike", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username:myname,
                leadername: username,
            }),
        });

        // Handle the response if needed

        // Call getData() to fetch updated data after submitting like
        await getData();
    } catch (error) {
        console.error('Error submitting like:', error);
        // Handle the error if needed
    }
}

function keyPressed() {
    if (keyCode === ENTER) {
        if (gameScreen === 0) {
            startGame();
        } else if (gameScreen === 2) {
            restart();
        }
    }
}

function startGame() {
    gameScreen = 1;
}

function gameOver() {
    sendScoreToServer();
    gameScreen = 2;
}

function restart() {
    // sendScoreToServer();
    score = 0;
    health = maxHealth;
    ballX = width / 4;
    ballY = height / 5;
    ballSpeedVert = 0;
    ballSpeedHorizon = 0;
    gameScreen = 1;
}

function drawBall() {
    fill(ballColor);
    ellipse(ballX, ballY, ballSize, ballSize);
}

function drawRacket() {
    fill(racketColor);
    rectMode(CENTER);
    rect(mouseX, mouseY, racketWidth, racketHeight, 5);
}

let hasScored = false;

function watchRacketBounce() {
    let overhead = mouseY - pmouseY;
    if (
        ballX + ballSize / 2 > mouseX - racketWidth / 2 &&
        ballX - ballSize / 2 < mouseX + racketWidth / 2
    ) {
        if (
            dist(ballX, ballY, ballX, mouseY) <= ballSize / 2 + abs(overhead)
        ) {
            makeBounceBottom(mouseY);
            ballSpeedHorizon = (ballX - mouseX) / 10;
            if (overhead < 0) {
                ballY += overhead / 2;
                ballSpeedVert += overhead / 2;
            }
            if (!hasScored) {
                score++;
                hasScored = true;
            }
        } else {
            hasScored = false;
        }
    } else {
        hasScored = false;
    }
}

function applyGravity() {
    ballSpeedVert += gravity;
    ballY += ballSpeedVert;
    ballSpeedVert -= ballSpeedVert * airfriction;
}

function applyHorizontalSpeed() {
    ballX += ballSpeedHorizon;
    ballSpeedHorizon -= ballSpeedHorizon * airfriction;
}

function makeBounceBottom(surface) {
    ballY = surface - ballSize / 2;
    ballSpeedVert *= -1;
    ballSpeedVert -= ballSpeedVert * friction;
}

function keepInScreen() {
    if (ballX - ballSize / 2 < 0) {
        ballX = ballSize / 2;
        ballSpeedHorizon *= -1;
    } else if (ballX + ballSize / 2 > width) {
        ballX = width - ballSize / 2;
        ballSpeedHorizon *= -1;
    }

    if (ballY - ballSize / 2 < 0) {
        ballY = ballSize / 2;
        ballSpeedVert *= -1;
    } else if (ballY + ballSize / 2 > height) {
        ballY = height - ballSize / 2;
        ballSpeedVert *= -1;
        decreaseHealth();
    }
}

function drawHealthBar() {
    noStroke();
    fill(189, 195, 199);
    rectMode(CORNER);
    rect(
        ballX - healthBarWidth / 2,
        ballY - 30,
        healthBarWidth,
        5
    );
    if (health > 60) {
        fill(46, 204, 113);
    } else if (health > 30) {
        fill(230, 126, 34);
    } else {
        fill(231, 76, 60);
    }
    rectMode(CORNER);
    rect(
        ballX - healthBarWidth / 2,
        ballY - 30,
        (healthBarWidth * health) / maxHealth,
        5
    );

    textAlign(CENTER);
    fill(255);
    textSize(14);
    text("health", ballX, ballY - 45);
}

function decreaseHealth() {
    health -= healthDecrease;
    if (health <= 0) {
        gameOver();
    }
}

function printScore() {
    textAlign(CENTER);
    fill(255);
    textSize(30);
    text("Score: " + score, width / 2, 50);
}
async function getData() {
    try {
        const response = await fetch("/showDB");
        const content = await response.json();
        showTable(content);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// function showTable(data) {
//     var keys = Object.keys(data);
//     var keys2 = Object.keys(data[keys[0]]);
//     var tablearea = document.getElementById("table")
//     var table = document.createElement("table");
//     var tr = document.createElement("tr");
//     for (var i = 0; i < keys2.length; i++) {
//         var th = document.createElement("th");
//         th.innerHTML = keys2[i];
//         tr.appendChild(th);
//     }
//     table.appendChild(tr);
//     for (var i = 0; i < keys.length; i++) {
//         var tr = document.createElement("tr");
//         for (var j = 0; j < keys2.length; j++) {
//             var td = document.createElement("td");
//             var temp = data[keys[i]];
//             td.innerHTML = temp[keys2[j]];
//             tr.appendChild(td);
//         }
//         table.appendChild(tr);
//     }
//     tablearea.innerHTML = "";
//     tablearea.appendChild(table);
// }

document.addEventListener("DOMContentLoaded", function () {
    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
});

function logout() {
    clearCookies();
    window.location.href = "login.html";
}

function clearCookies() {
    var cookieNames = ["username"]; 

    cookieNames.forEach(function (cookieName) {
        document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    });
}

function showTable(data) {
    keys = Object.keys(data);
    var keys2 = Object.keys(data[keys[0]]);
    var tablearea = document.getElementById("table")
    var table = document.createElement("table");
    var tr = document.createElement("tr");

    // เปลี่ยนชื่อคอลัมน์ให้เป็น User, Score, Likes
    var columnNames = ["User", "Score", "Likes"];

    for (var i = 0; i < columnNames.length; i++) {
        var th = document.createElement("th");
        th.innerHTML = columnNames[i];
        tr.appendChild(th);
    }

    table.appendChild(tr);

    for (var i = 0; i < keys.length; i++) {
        var tr = document.createElement("tr");

        for (var j = 0; j < keys2.length; j++) {
            var td = document.createElement("td");
            var temp = data[keys[i]];
            td.innerHTML = temp[keys2[j]];
            tr.appendChild(td);
        }

        var button = document.createElement("button");

        button.innerHTML = `Like for Rank ${i + 1}`;

        button.addEventListener("click", function (index) {
            return async function () {
                const selectedUser = data[keys[index]].leadername;
                await sendLikeToServer(selectedUser);
            };
        }(i));

        button.classList.add("table-but");

        tr.appendChild(button);
        table.appendChild(tr);
    }

    tablearea.innerHTML = "";
    tablearea.appendChild(table);

    table.style.marginTop = "10px";
    // table.style.marginRight = "10px";
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";

    // Add style to create space between cells
    var cells = table.getElementsByTagName("td");
    for (var k = 0; k < cells.length; k++) {
        cells[k].style.padding = "8px";
    }
}

function getCookie(name){
	var value = "";
	try{
		value = document.cookie.split("; ").find(row => row.startsWith(name)).split('=')[1]
		return value
	}catch(err){
		return false
	} 
}
function setUsername(){
    username = getCookie('username');
	var x = document.getElementById("username");
	x.innerHTML = username;

	timer = setInterval (loadLog, 1000);//Reload file every 3000 ms
	document.getElementById("submitmsg").disabled = false;
	readLog();
}


function loadLog(){
	readLog();
}

function sendMsg(){
	//get msg
	var text = document.getElementById("userMsg").value;
	document.getElementById("userMsg").value = "";
	writeLog(text);
}

//ทำให้สมบูรณ์
const writeLog = async (msg) => {
    const d = new Date();

    try {
        const response = await fetch("/outmsg", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                time: d.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
                user: username,
                message: msg
            })
        });
    } catch (err) {
        console.error(err);
    }
};

//ทำให้สมบูรณ์
const readLog = (async () => {
	let response = await fetch("/inmsg");
	let responsedata = await response.json();
	postMsg(responsedata);
})

// รับ msg ที่เป็น JS object ที่อ่านมาได้จาก file
function postMsg(msg) {
    var x = document.getElementById("chatbox");
    while (x.firstChild) {
        x.removeChild(x.lastChild);
    }

    if (msg.dataMsg && msg.dataMsg.length > 0) {
        for (var item of msg.dataMsg) {
            var div_d = document.createElement("div");
            div_d.className = "message";
            
            // แปลงเวลาใน item.reg_date เป็นวัตถุ Date
            var regDate = new Date(item.reg_date);

            // กำหนดรูปแบบเวลาที่ต้องการ
            var optionsDate = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            };

            var optionsTime = {
                hour: 'numeric',
                minute: 'numeric',
            };

            
            var dateStr = regDate.toLocaleString('en-US', optionsDate);
            var timeStr = regDate.toLocaleString('en-US', optionsTime);
			var timemsg = document.createTextNode("[" + dateStr + "] [" + timeStr + "] ");

            var boldmsg = document.createElement("b");
            boldmsg.innerHTML = item.username || "Undefined User";

            var textmsg = document.createTextNode(": " + (item.text || ""));

            div_d.append(timemsg, boldmsg, textmsg);
            div_d.appendChild(document.createElement("br"));
            x.appendChild(div_d);
        }
    }
    checkScroll();
}
function checkScroll(){
	var chatbox = document.getElementById('chatbox');
	var scroll = chatbox.scrollTop+chatbox.clientHeight === chatbox.scrollHeight;
	if (!scroll) {
    	chatbox.scrollTop = chatbox.scrollHeight;
  	}
}
