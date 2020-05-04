/*
This plugin record every updates made by users on pad.
These records then saved in csv format for further processing.
Developer: Pankaj Chejara
*/



// import filesytem package
var fs = require('fs');

// import changeset library from ehterpad to process changeset (it is a string containing information of updates)
var Changeset = require("ep_etherpad-lite/static/js/Changeset");



// This function gets called whenever server received a message from client user
// For instance, when client join a pad, update text in pad, leave the pad
exports.handleMessage = function(hook, context,callback){



  // Fetching data from the context parameter
  message = context.message;

  // building current time stamp
  let date_ob = new Date();

  // current date
  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();

  // prints date & time in YYYY-MM-DD HH:MM:SS format
  //ts = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;


  // prints date & time in YYYY-MM-DD HH:MM:SS format
  ts = hours + ":" + minutes + ":" + seconds + " " + date + "-" + month + "-" + year;

  // adding timestamp to the entry to save in file
  data = ts;

  // this flag used to process only USER_CHANGES type messages
  flag= false;

  // Add ip to the entry
  data  =  data + "," + context.client.conn.remoteAddress;


  // For storing changeset of operations
  subops = "";

  // For storing number of characters added
  plus = 0;

  // For storing number of characters deleted
  minus = 0;

  file_flag = true;

    if (message.type == "CLIENT_READY") {
        group_info = context.message.padId;
        group_info = group_info + ',' + context.client.id;
        group_info = group_info + ',' + context.message.token + "\n";

        fs.appendFileSync("group_membership.csv", group_info, (err) => {
            if (err) console.log("File can't be saved"+err);

        });
        console.log('[Group_Join] Client_id "' + context.client.id + '": Pad_id "' + context.message.padId + '" : Token "' + context.message.token + '" Joined the Group');

    }  else if(message.type == "COLLABROOM") {
        if (message.data.type == "USER_CHANGES") {

            client_id = context.client.id;
            //console.log(client_id + ',' + JSON.stringify(message.data));
            flag = true;
            data = data + ',' + client_id + ',UPDATE';
           console.log('[USER_CHANGES] Client_id "' + context.client.id + '": data "' + JSON.stringify(message.data) + '" Changed the name');


        } else if (message.data.type == "USERINFO_UPDATE") {

            c_id = context.client.id;
            a_name = message.data.userInfo.name;
            a_id = message.data.userInfo.userId;

            // console.log(c_id + ":" + a_name);

            ip_entry = "";

            ip_entry = c_id + "," + a_id + "," + a_name + "\n";
            // Create a new file with IP to Name mapping
            fs.appendFileSync("user_mapping.csv", ip_entry, (err) => {
                if (err) console.log("File can't be saved" + err);
                //console.log("IP mapping written to File.");
            });
            //console.log(ip_entry);
            console.log('[NAME_CHANGE] Client_id "' + context.client.id + '": Author_name "' + message.data.userInfo.name + '" : Author_id "' + a_id + '" Changed the name');


        } else if (message.data.type == "CHAT_MESSAGE") {
            c_id = context.client.id;
            text = message.data.text;
            chat_msg = ts + "," + c_id + "," + text + "\n";
            // Create a new file with IP to Name mapping
            fs.appendFileSync("chat_msg_all.csv", chat_msg, (err) => {
                if (err) console.log("File can't be saved" + err);
                //console.log("IP mapping written to File.");
            });
            //console.log(chat_msg);
            console.log('[NEW_CHAT_MSG] Client_id "' + context.client.id + '": Text "' + text + '" Sent the chat msg');

        }
    }



  /*

  // Iterate over all keys in msg data (data stored in json format)
  for(var attributename in myobject){




    // If attributename is type and it is USER_CHANGES then add update entry and set flag true

    if (attributename == "type"){

        // Record which users entered in which pad
        if(myobject[attributename]=="CLIENT_READY"){
            group_info = context.message.padId;
            group_info = group_info + ',' + context.client.id;
            group_info = group_info + ',' + context.message.token;

            fs.appendFileSync("group_membership.csv", group_info, (err) => {
                if (err) console.log("File can't be saved"+err);

            });
        }


      // Check whether user changed his name or not
      if(myobject[attributename]=='USERINFO_UPDATE')

      {
          c_id = context.client.id;
          a_name = msg.userInfo.name;

         // console.log(c_id + ":" + a_name);

         ip_entry = "";

         ip_entry = c_id+","+a_name+"\n";
         // Create a new file with IP to Name mapping
         fs.appendFileSync("user_mapping.csv", ip_entry, (err) => {
           if (err) console.log("File can't be saved"+err);
           //console.log("IP mapping written to File.");
         });


        user_update_log = myobject["userInfo"];



      }

      if (myobject[attributename]=="USER_CHANGES") {
          client_id = context.client.id;
          console.log(client_id);
        flag=true;
         data = data +','+ client_id +',UPDATE';
       }
     }
     */
     // console.log(myobject);
    // If attributename is changeset and it is with USER_CHANGES type
    if (flag == true){

      cs = message.data.changeset;

      // Unpack the changeset using Changeset library
      unpacked = Changeset.unpack(cs);
      // console.log(unpacked);

      // Add old lenght, new length, operations, character bank to the entry
      data = data + ","+ unpacked.oldLen + "," + unpacked.newLen + "," + unpacked.ops + ",'" + (unpacked.charBank).trim()+"'";



      // Iterator over the operations extracted from changeset
      var opiterator = Changeset.opIterator(unpacked.ops);

      // hasNext() return true if it has a operator otherwise false

      while (opiterator.hasNext()){
        subop = opiterator.next();
        if ( subop.opcode == "+" ) {
           plus = plus + 1;
         }
         if ( subop.opcode == "-" ) {
            minus = minus + 1
          }
      }
    }

  data = data + "," + plus + "," + minus +  "\n";
  plus = 0;
  minus = 0;
  //console.log(data);

  // if flag is true then only write entry into the file
  if (flag == true){
    // save data in data.csv

    fs.appendFileSync("log_data.csv", data, (err) => {
      if (err) console.log("File can't be saved"+err);
      console.log("Successfully Written to File.");

    });
  flag=false;
  }


  // This function will handle the coming message further (taken care by etherpad)
  callback();
  }
