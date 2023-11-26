const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/img/');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const imageFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};


const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mydb"
})


con.connect(err => {
    if (err) throw (err);
    else {
        console.log("MySQL connected");
    }
})

const queryDB = (sql) => {
    return new Promise((resolve, reject) => {
        
        con.query(sql, (err, result, fields) => {
            if (err) reject(err);
            else
                resolve(result)
        })
    })
}

//ทำให้สมบูรณ์
app.post('/regisDB', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        
        const createTableQuery = "CREATE TABLE IF NOT EXISTS userInfoTest (id INT AUTO_INCREMENT PRIMARY KEY, reg_date TIMESTAMP, username VARCHAR(255), email VARCHAR(100), password VARCHAR(100), img VARCHAR(100))";
        await queryDB(createTableQuery);

       
        // const createTablePost = "CREATE TABLE IF NOT EXISTS post (id INT AUTO_INCREMENT PRIMARY KEY, reg_date TIMESTAMP, text VARCHAR(255), username VARCHAR(255))";
        // await queryDB(createTablePost);

        const createTableScore = "CREATE TABLE IF NOT EXISTS scoreTest (id INT AUTO_INCREMENT PRIMARY KEY, reg_date TIMESTAMP, leadername VARCHAR(255), score VARCHAR(255), Nlike VARCHAR(255))";
        await queryDB(createTableScore);

        const createTableLike = "CREATE TABLE IF NOT EXISTS likeTest (id INT AUTO_INCREMENT PRIMARY KEY, reg_date TIMESTAMP, username VARCHAR(255), leadername VARCHAR(255))";
        await queryDB(createTableLike);

        const createTablePostja = "CREATE TABLE IF NOT EXISTS postja (id INT AUTO_INCREMENT PRIMARY KEY, reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, text VARCHAR(255), username VARCHAR(255))";
        await queryDB(createTablePostja);

        
        const checkUsernameQuery = `SELECT * FROM userInfoTest WHERE username = "${username}"`;
        const existingUser = await queryDB(checkUsernameQuery);

        if (existingUser.length > 0) {
            console.log("Username is already taken");
            return res.redirect('register.html?error=1');
        }

        
        const insertUserQuery = `INSERT INTO userInfoTest (username, email, password,img) VALUES ("${username}", "${email}", "${password}","avatar.png")`;
        await queryDB(insertUserQuery);

        console.log("New record created successfully");
        return res.redirect('login.html');
    } catch (error) {
        console.error('Error checking username or inserting new record:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.post('/profilepic', (req, res) => {
    let upload = multer({ storage: storage, fileFilter: imageFilter }).single('avatar');

    upload(req, res, async (err) => {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send('Please select an image to upload');
        }
        else if (err instanceof multer.MulterError) {
            return res.send(err);
        }
        else if (err) {
            return res.send(err);
        }

        const img_file = req.file.filename;
        const user = req.cookies["username"];
        await res.cookie("img", img_file)
        await updateImg(user, img_file);
        try {
            // อัปเดตภาพโปรไฟล์ในฐานข้อมูล MySQL
            const updateImgQuery = `UPDATE userInfoTest SET img = '${img_file}' WHERE username = '${user}'`;
            await queryDB(updateImgQuery);
            return res.redirect('message.html');
        } catch (error) {
            console.error('Error updating profile image in the database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });
})

const updateImg = async (username, img_file) => {
    try {
        // ดึงข้อมูลผู้ใช้จากฐานข้อมูล MySQL
        const getUserQuery = `SELECT * FROM userInfoTest WHERE username = '${username}'`;
        const userData = await queryDB(getUserQuery);

        if (userData.length > 0) {
            // อัปเดตข้อมูลรูปภาพในฐานข้อมูล MySQL
            const updateUserImgQuery = `UPDATE userInfoTest SET img = '${img_file}' WHERE username = '${username}'`;
            await queryDB(updateUserImgQuery);
        } else {
            console.log('User not found in the database');
        }
    } catch (error) {
        console.error('Error updating user image in the database:', error);
    }
}

//ทำให้สมบูรณ์
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('img');
    return res.redirect('login.html');
})

//ทำให้สมบูรณ์
app.get('/readPost', async (req, res) => {
    try {
        const sql = 'SELECT * FROM post';
        const result = await queryDB(sql);
        res.json(result);
    } catch (error) {
        console.error('Error reading posts from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//ทำให้สมบูรณ์
app.post('/writePost', async (req, res) => {
    try {
        const { user, message } = req.body;

        const sql = `INSERT INTO post (username, text) VALUES ("${user}", "${message}")`;
        await queryDB(sql);

        res.end();
    } catch (error) {
        console.error('Error writing post to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//ทำให้สมบูรณ์
app.post('/checkLogin', async (req, res) => {
    // ถ้าเช็คแล้ว username และ password ถูกต้อง
    // return res.redirect('feed.html');
    // ถ้าเช็คแล้ว username และ password ไม่ถูกต้อง
    // return res.redirect('login.html?error=1')
    const { username, password } = req.body;

    const sql = `SELECT * FROM userInfoTest WHERE username = "${username}"`;

    try {
        const result = await queryDB(sql);
        const user = result[0];

        if (user && user.password === password) {
            // ถ้าชื่อผู้ใช้และรหัสผ่านถูกต้อง
            res.cookie('username', username);
            res.cookie('img', user.img)
            return res.redirect('message.html');
        } else {
            // ถ้าชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง
            return res.redirect('login.html?error=1');
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        return res.redirect('login.html?error=1');
    }
})
app.get('/readScore', async (req, res) => {
    try {
        const sql = 'SELECT * FROM scoreTest';
        const result = await queryDB(sql);
        res.json(result);
    } catch (error) {
        console.error('Error reading posts from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
// app.post('/submitScore', async (req, res) => {
//     try {
//         const { score } = req.body;

//         // Check if score is provided in the request body
//         if (!score) {
//             return res.status(400).json({ success: false, message: 'Score is required.' });
//         }

//         // Insert the score into the MySQL database
//         const insertScoreQuery = `INSERT INTO score (score) VALUES ("${score}")`;
//         await queryDB(insertScoreQuery);

//         // Redirect or respond as needed
//         return res.redirect('message.html');
//     } catch (error) {
//         console.error('Error submitting score:', error);
//         return res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// });
app.post('/submitScore', async (req, res) => {
    try {
        const { user, score, nlike } = req.body;

        // Check if score is provided in the request body
        if (!score) {
            return res.status(400).json({ success: false, message: 'Score is required.' });
        }

        // Convert score to a number
        const numericScore = parseInt(score, 10);

        // Check if the conversion is successful
        if (isNaN(numericScore)) {
            return res.status(400).json({ success: false, message: 'Invalid score format.' });
        }

        // Check if the user already has a score
        const checkUserScoreQuery = `SELECT * FROM scoreTest WHERE leadername = "${user}"`;
        const existingUserScore = await queryDB(checkUserScoreQuery);

        if (existingUserScore.length > 0) {
            // If the user already has a score, update it if the new score is higher
            const existingScore = parseInt(existingUserScore[0].score, 10);

            if (numericScore > existingScore) {
                const updateScoreQuery = `UPDATE scoreTest SET score = ${numericScore}, nlike = nlike + ${nlike} WHERE leadername = "${user}"`;
                await queryDB(updateScoreQuery);
            }
        } else {
            // If the user doesn't have a score, insert a new score
            const insertScoreQuery = `INSERT INTO scoreTest (leadername, score, nlike) VALUES ("${user}", ${numericScore}, ${nlike})`;
            await queryDB(insertScoreQuery);
        }

        // Redirect or respond as needed
        return res.redirect('message.html');
    } catch (error) {
        console.error('Error submitting score:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// show data
app.get("/showDB", async (req, res) => {
    // let sql = `SELECT * FROM ${tablename}`;
    let sql = `SELECT leadername, score , Nlike FROM scoreTest ORDER BY CAST(score AS SIGNED) DESC LIMIT 7`;
    let result = await queryDB(sql);
    result = Object.assign({}, result);
    res.json(result);
})
app.get('/cookies', (req, res) => {
    if (!req.cookies.like) {
        // ถ้าไม่มีคุกกี้ 'like', เซ็ตค่าและทำการ redirect
        // sendLikesToDatabase(2);
        res.cookie('like', '2', { maxAge: 10000, path: '/' });
        return res.redirect('message.html');
    } else {
        // ถ้ามีคุกกี้ 'like', ไม่ต้องทำอะไร
        return res.redirect('message.html');
    }
});
// async function sendLikesToDatabase(likeCount) {
//     try {
//         const response = await fetch("http://localhost:3000/submitLike", {
//             method: "POST",
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ like: likeCount }), // ใช้ชื่อตัวแปรที่ถูกต้อง
//         });
//         // จัดการกับการตอบกลับหากจำเป็น
//     } catch (error) {
//         console.error('เกิดข้อผิดพลาดในการส่ง like:', error);
//         // จัดการกับข้อผิดพลาดหากจำเป็น
//     }
// }
// app.post('/submitLike', async (req, res) => {
//     // if (!req.cookies.like) {
//     // ถ้าไม่มีคุกกี้ 'like', เซ็ตค่าและทำการ redirect
//     // sendLikesToDatabase(2);
//     // res.cookie('like', '2', { maxAge: 10000, path: '/' });
//     // return res.redirect('message.html');
//     // } else {
//     // ถ้ามีคุกกี้ 'like', ไม่ต้องทำอะไร
//     //     return res.redirect('message.html');
//     // }
//     if (!req.cookies.like) {
//         try {
//             const { like } = req.body;

//             // Check if score is provided in the request body
//             // if (!like) {
//             //     return res.status(400).json({ success: false, message: 'like is required.' });
//             // }

//             // Insert the score into the MySQL database
//             const insertScoreQuery = `INSERT INTO Numlike (Numlike) VALUES ("${like + 1}")`;
//             await queryDB(insertScoreQuery);
//             res.cookie('like', '2', { maxAge: 10000, path: '/' });
//             return res.redirect('message.html');

//         } catch (error) {
//             console.error('Error submitting score:', error);
//             return res.status(500).json({ success: false, message: 'Internal Server Error' });
//         }
//     } else {
//         // ถ้ามีคุกกี้ 'like', ไม่ต้องทำอะไร
//         return res.redirect('message.html');
//     }
// });
app.post('/submitLike', async (req, res) => {
    try {
        const { username, leadername } = req.body;

        // ตรวจสอบว่ามีชื่อผู้ใช้ในตาราง likeTest หรือไม่
        const checkUserInLikeQuery = `SELECT * FROM likeTest WHERE username = "${username}" AND leadername = "${leadername}"`;
        const userInLikeResult = await queryDB(checkUserInLikeQuery);

        if (userInLikeResult.length > 0) {
            // ถ้ามีชื่อผู้ใช้ในตาราง likeTest แล้ว ให้ทำการลบข้อมูล
            const deleteLikeQuery = `DELETE FROM likeTest WHERE username = "${username}" AND leadername = "${leadername}"`;
            await queryDB(deleteLikeQuery);

            // นับจำนวนชื่อของ leadername ที่มีในตาราง likeTest
            const numLikeQuery = `SELECT COUNT(leadername) AS numLike FROM likeTest WHERE leadername = "${leadername}"`;
            const numLikeResult = await queryDB(numLikeQuery);

            // ดึงจำนวน like จากผลลัพธ์
            const numLike = numLikeResult[0].numLike;

            // อัปเดตฟิลด์ Nlike ใน MySQL database เฉพาะสำหรับ username ที่ระบุ
            const updateLikeQuery = `UPDATE scoreTest SET Nlike = "${numLike}" WHERE leadername = "${leadername}"`;
            await queryDB(updateLikeQuery);

            return res.status(200).json({ success: true, message: 'การกดถูกใจสำเร็จ.' });
        } else {
            // ถ้ายังไม่มีให้ทำการ insert
            const insertLikeQuery = `INSERT INTO likeTest (username, leadername) VALUES ("${username}", "${leadername}")`;
            await queryDB(insertLikeQuery);

            // นับจำนวนชื่อของ leadername ที่มีในตาราง likeTest
            const numLikeQuery = `SELECT COUNT(leadername) AS numLike FROM likeTest WHERE leadername = "${leadername}"`;
            const numLikeResult = await queryDB(numLikeQuery);

            // ดึงจำนวน like จากผลลัพธ์
            const numLike = numLikeResult[0].numLike;

            // อัปเดตฟิลด์ Nlike ใน MySQL database เฉพาะสำหรับ username ที่ระบุ
            const updateLikeQuery = `UPDATE scoreTest SET Nlike = "${numLike}" WHERE leadername = "${leadername}"`;
            await queryDB(updateLikeQuery);

            return res.status(200).json({ success: true, message: 'การกดถูกใจสำเร็จ.' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการส่งถูกใจ:', error);
        return res.status(500).json({ success: false, message: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
});

app.get('/inmsg', async (req, res) => {
    try {
        const sql = 'SELECT * FROM postja';
        const result = await queryDB(sql);
        res.json({ dataMsg: result });
    } catch (error) {
        console.error('Error reading messages from database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.post('/outmsg', async (req, res) => {
    try {
        const newData = req.body;
        const { time, user, message } = newData;
        
        const sql = `INSERT INTO postja (reg_date, text, username) VALUES (NOW(), '${message}', '${user}')`;
        await queryDB(sql);
  
        res.send();
    } catch (error) {
        console.error('Error writing message to database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.listen(port, hostname, () => {
    console.log(`Server running at   http://${hostname}:${port}/login.html`);
});

