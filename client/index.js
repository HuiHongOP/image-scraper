var inputFile = document.getElementById("submit");
inputFile.addEventListener("click",async function(e) {
    //prevent browser going another page or url
    e.preventDefault();

    //Get the file uploaded from the form
    var file = $("#form")[0][0].files[0];

    //Alert the user that no file is uploaded
    if (!file){
      return alert("Please select an excel file");
    }
    //Set up content reader of the flie
    var reader = new FileReader();
    reader.onload = async function(event){

      //Data will be an ArrayBuffer
      var workBook = XLSX.read(event.target.result);
      
      //Exporting the workBook as xlsx base64
      var wbout = XLSX.write(workBook,{booktype:"xlsx", bookSST: false, type:"base64"});

      //Create a bundle of data and pass it as object
      var formData = new FormData();
      formData.append('file',"dropbox.xlsx");
      formData.append('data',wbout);

      /* Sending FormData as data into the server using "POST" method
        processData: false prevents conversion of data to strings */
      document.getElementById("loader-display").style.visibility = "visible";

      await $.ajax({
        url:"/upload",
        type: "POST",
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: function(response){
          console.log(response);
        }
      })

      document.getElementById("loader-display").style.visibility = "hidden";
      document.getElementById("database-link").style.visibility = "visible";
      console.log("Finished the process");
    };
    reader.readAsArrayBuffer(file);
})
