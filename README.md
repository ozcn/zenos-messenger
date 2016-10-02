Ionic Starter Messenger
=====================

Ionic Starter Messenger is for building up your social media app quickly and beautifully with ionicframework. The structure of the starter is based on Facebook Messenger.

## Demo
Demo URL: https://ionic-starter-messenger.firebaseapp.com
it's work with web browser, hosting at firebase.


Demo account: ```felix@istarter.io```
password: ```messenger```


You can login with your own social account or email.

## Firebase V3.0 signInWithPopup/Redirect problem
Currently Firebase V3 auth's signInWithPopup/Redirect do not work in cordova apps, you can check discuss at: https://groups.google.com/forum/#!msg/firebase-talk/mC_MlLNCWnI/cL0OnL4hAwAJ


On next firebase version, these problem may fixed. I create another project that use cordova plugin solve the problem. Take a look at:
http://market.ionic.io/starters/ionic-starter-firebase


Ionic Starter Firebase package can download free, if you already buy Ionic Starter Messenger.

## Download Files
1. Static version run with local service data, the download file name: ionic-starter-messenger-master.zip
2. Firebase version, download file name: ionic-starter-messenger-firebase.zip
3. Addition ionic-starter-firebase file: ionic-starter-firebase-master.zip

##  Features
1. Firebase integrate, from version 1.1, this starter provide Firebase integrate version;
2. Quality sample data, so you can integrate with other service easily;
3. 12 Templates, well designed according to ionic component theory;
4. Search demo with angular filter;

## Using this project
Use Ionic CLI for installation, and make sure that node.js is installed in your workspace. More info: http://ionicframework.com/docs/cli/

### Local sample data version
This project default work with local sample data. So you can use ionc command line tool run the project:
```
$ cd to/your/project
$ ionic serve
```

### Firebase version
Firebase integrate as separate version of this project, so download firebase version and replace firebase api setting at index.html:
```
var config = {
  apiKey: "your api key here",
  authDomain: "your api domain",
  databaseURL: "your api database url",
  storageBucket: "your api storage url",
};
```
then run:
```
$ ionic serve
```

### Add to your project
if you want setting this starter work with your exist project, you should install some library:
```
$ bower install angularfire --save
$ bower install angular-messages --save
$ bower install angular-md5 --save
$ bower install angular-moment --save
```

and add library at index.html:
```
<!-- angular messages -->
<script src="lib/angular-messages/angular-messages.min.js"></script>

<!-- Firebase -->
<script src="lib/firebase/firebase.js"></script>

<!-- AngularFire -->
<script src="lib/angularfire/dist/angularfire.min.js"></script>

<!-- Angular md5 -->
<script src="lib/angular-md5/angular-md5.min.js"></script>

<!-- angular-moment -->
<script src="lib/moment/moment.js"></script>
<script src="lib/angular-moment/angular-moment.min.js"></script>

```

inject it at app.js:
```
angular.module('starter', ['ionic', 'ngMessages', 'firebase', 'angular-md5', 'angularMoment', ...
```

## Templates
1. Login & Sign up: Include entire steps of sign up and forgot password;
2. Tab Activities: List your latest activities;
3. Tab Groups: List all of your groups;
4. Tab Friends: List all of your friends, and check who is online;
5. Tab Account: Set your account;
6. Room: Type a message and be replied in a room;
7. Room Setting: To see who is in the room, you can leave or invite new friend;
8. Search: Search for friends and conversation with Angular filter;
9. New Chat & New Group: Start a new chat with one of your friend or create a new group.
and more… 

## Setting
1. Hiding status bar at startup on iOS: Modify your app's Info.plist, Set "Status bar is initially hidden" to "YES" and set "View controller-based status bar appearance" to "NO". Please see the document: https://github.com/apache/cordova-plugin-statusbar#hiding-at-startup
2. Change App icon and Splash: Change the two files: /resources/icon.psd & /resources/splash.psd, then generate: ```$ ionic resources```

## Roadmap
1. image upload, so can send image chat, setting avatar;
2. database and storage rules;
3. better loading process;
4. better document;
