//The libraries being used
const express = require("express");
const {chromium} = require("playwright-chromium");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const {Client} = require("pg");
const console = require("console");
var format = require("pg-format");
const pgp = require("pg-promise")({capSQL:true});

//Connect to the environment port or localhost
const PORT = process.env.PORT || 8080;
const app = express();
// const __dirname = path.resolve();

//Allowing the client folder as static
app.use(express.static("./client"));

app.use(express.urlencoded({ extended: true })); 


app.get('/', (req, res) =>{
    res.sendFile(path.resolve(__dirname +'index.html'));
}
)
const excelName = "dropbox";

//This is the POST where the encoded base64 FormData is send to here
app.post("/upload", async (req,res)=>{
    await deletePreviousData();
    var form = new formidable.IncomingForm();
    console.log("Start the post METHOD");
    var dataFromExcel = await new Promise(function(resolve,reject){
        form.parse(req, function(_err,fields,files){
            //decode the data using base64 and make a file
            if(_err){
                reject(_err);
                return;
            }
            //return the data passed from frontend
            resolve(fields);
        });
    });
    //decode the passed data from FormData
    var decodedBits = Buffer.from(dataFromExcel.data,"base64");
    //read it using xlsx library
    const reader = xlsx.read(decodedBits, {cellDates: true});
    //reading the sheet into json data
    var datas = xlsx.utils.sheet_to_json(reader.Sheets["Sheet1"]);
    //call function to fetch the url links and add them into the queries of the table
    await mapData(datas);
    console.log("POST DONE!");
    res.send("POST Run Success");
})

//adding the data for the queries into the table
async function performQuery(excelJSON){
    const client = new Client({
        host: "",
        user: "",
        password: "",
        database: "",
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    client.connect(function(err){
        if(err){
            console.log("Failed Connection");
        }
        else{
            console.log("Connected")
        };
    });
    client.on('error', err=>{
        console.error('somehing bad has happened!',err);
    })
    return new Promise((resolve,reject) =>{
        client.query(`INSERT INTO excelformat (SKU, Xpath, Image1, Image2, Image3, Image4, Image5, Image6,
            Image7, Image8, Image9, Image10, ImageURL1, ImageURL2, ImageURL3, ImageURL4, ImageURL5, ImageURL6, ImageURL7,
            ImageURL8, ImageURL9,ImageURL10) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`, [excelJSON.SKU, excelJSON.Xpath,
            excelJSON.Image1, excelJSON.Image2, excelJSON.Image3, excelJSON.Image4, excelJSON.Image5, excelJSON.Image6, excelJSON.Image7, excelJSON.Image8, excelJSON.Image9, excelJSON.Image10, 
            excelJSON.ImageURL1, excelJSON.ImageURL2, excelJSON.ImageURL3, excelJSON.ImageURL4, excelJSON.ImageURL5, excelJSON.ImageURL6,
            excelJSON.ImageURL7, excelJSON.ImageURL8, excelJSON.ImageURL9, excelJSON.ImageURL10], (err, res) => {
                if (err)
                    reject(err);
                client.end();
                console.log("performQuery DONE!");
                resolve(true);
        });
    });
}

//delete the data for the previous table
async function deletePreviousData(){
    const client = new Client({
        host: "",
        user: "",
        password: "",
        database: "",
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    client.connect(function(err){
        if(err){
            console.log("Failed Connection");
        }
        else{
            console.log("Connected")
        };
    });
    client.on('error', err=>{
        console.error('somehing bad has happened!',err);
    })
    return new Promise((resolve,reject)=>{
        client.query(`DELETE FROM excelFormat;`,(err, res)=>{
            if (err) reject(err);
            client.end();
            resolve(true);
            console.log("Successfully deleted the data in the table");
        });
    });
}


//Help to go through the passed url with Xpath and get the image attribute
async function scrapeWebsiteImage(url,xpath){
    const browser = await chromium.launch({ chromiumSandbox: false });
    try{
        const page = await browser.newPage();
        //Go to the url link
        await page.goto(url);
        //Get the xpath's element's attribute for soruce
        const src = await page.locator(xpath).getAttribute('src');
        return src;
    }catch(err){
        console.error(err);
    }
    finally{
        //End the browser link
        await browser.close();
    }
}
//Go through the excel file and loop through all of the image url and get their attributes for .jpg
async function mapData(data){
    // var workBook= xlsx.readFile(`./tmp/${excelName}.xlsx`,{cellDates: true});
    // var workSheet = workBook.Sheets["Sheet1"];
    // var data = xlsx.utils.sheet_to_json(workSheet);
    console.log("-------------Begin of scaping and inserting queries---------------");
    //Loop through all the 10 columns for provided image links and produce out the imageURL of .jgp or any other formats
    for(var i = 0; i<data.length;i++){
        for(var j = 1; j<=10;j++){
            var concat_ImageNumber = "Image" +j;
            var concat_ImageURL = "ImageURL"+j;
            var imageLink = await scrapeWebsiteImage(data[i][concat_ImageNumber],data[0]["Xpath"]);
            data[i][concat_ImageURL] = imageLink;
            console.log(`this number is ${j}`);
        }
        const objectRow = data[i];
        await performQuery(objectRow);
        // console.log("processing");
    }
    console.log("-------------End of insertion for queries------------------");
}

//To show that we got connected to the localhost
app.listen(PORT, ()=>{
    console.log('Server lstening on ' +PORT);
});
