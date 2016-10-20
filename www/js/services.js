angular.module('starter.services', [])
.factory('Activities', function( $firebaseArray, $firebaseObject ) {
  var ref = firebase.database().ref().child("activities");
  var activities = $firebaseArray(ref);

  return {
    group: function(userId){
      return $firebaseArray(ref.child(userId).orderByChild("chatType").equalTo('group'));
    },
    all: function(userId){
      return $firebaseArray(ref.child(userId));
    },
    get: function(userId, chatId){
      return $firebaseObject(ref.child(userId + '/' + chatId));
    },
    add: function(userId, chatId, name, lastText, face, members, chatType){
      $firebaseObject(ref.child(userId + '/' + chatId)).$loaded(function(activityObj){
        if( name != '' ){
          activityObj.name = name;
        }
        if( lastText != '' ){
          activityObj.lastText = lastText;
        }
        if( face != '' ){
          activityObj.face = face;
        }
        if( chatType != '' ){
          activityObj.chatType = chatType;
        }
        if( members != '' ){
          activityObj.members = members;
        }
        activityObj.lastUpdate = firebase.database.ServerValue.TIMESTAMP;
        return activityObj.$save();
      });
    }
  };
})
.factory('Members', function( $firebaseArray, $firebaseObject ){
  var ref = firebase.database().ref().child("members");
  var members = $firebaseArray(ref);

  return {
    get: function(chatId){
      return $firebaseArray(ref.child(chatId));
    },
    addMember: function(chatId, memberId){
      var memberObj = $firebaseObject(ref.child(chatId + '/' + memberId));
      memberObj.$value = true;
      return memberObj.$save();
    }
  }
})
.factory('Users', function( $firebaseArray, $firebaseObject, md5 ){
  var ref = firebase.database().ref().child("users");
  var connectedRef = firebase.database().ref().child(".info/connected");
  var users = $firebaseArray(ref);

  return {
    all: users,
    getName: function(userId){
      return users.$getRecord(userId).name;
    },
    get: function(userId){
      return $firebaseObject(ref.child(userId));
    },
    getFace: function(userId){
      return users.$getRecord(userId).face;
    },
    setEmailUser: function(userId, displayName, email){
      var user = $firebaseObject(ref.child(userId));
      user.name = displayName;
      user.face = '//www.gravatar.com/avatar/' + md5.createHash(email);
      return user.$save();
    },
    setOnline: function(userId){
      var connected = $firebaseObject(connectedRef);
      var online = $firebaseArray(ref.child(userId + '/online'));
      var lastOnline = ref.child(userId + '/lastOnline');
      lastOnline.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);

      connected.$watch(function () {
        if (connected.$value === true) {
          online.$add(true).then(function (connectedRef) {
            connectedRef.onDisconnect().remove();
          });
        }
      });
    },
    updateProfile: function(user, profile) {
      if(profile.displayName){
        user.name = profile.displayName;
      }
      if(profile.photoURL){
        user.face = profile.photoURL;
      }
      if(profile.providerId){
        if(profile.providerId == "password"){
          user.provider = profile.email;
        }
        else{
          user.provider = profile.providerId;
        }

      }
      return user.$save();
    },

    remove: function(user) {
      users.splice(users.indexOf(user), 1);
    },
    get: function(uid){
      return $firebaseObject(ref.child(uid));
    },
  };
})

.factory('Chats', function( $firebaseArray, $firebaseObject, Privates, Members, Activities, Users ) {
  var ref = firebase.database().ref().child("chats");
  var chats = $firebaseArray(ref);

  return {
    all: chats,
    newGroup: function(membersList){
      var chat = {
        type : "group",
        lastUpdate : firebase.database.ServerValue.TIMESTAMP
      };
      return chats.$add(chat).then(function(ref){
        Members.get(ref.key);
        for(var i=0; i<membersList.length; i++){
          Members.addMember(ref.key, membersList[i].$id);
        }

        return $firebaseObject(ref.child(ref.key));
      });

    },
    newPrivate: function(userId, friendId){
      var chat = {
        type : "private",
        lastUpdate : firebase.database.ServerValue.TIMESTAMP
      };
      return chats.$add(chat).then(function(ref){
        Members.get(ref.key);
        Members.addMember(ref.key, userId);
        Members.addMember(ref.key, friendId);

        Privates.add(userId, friendId, ref.key);
        Privates.add(friendId, userId, ref.key);

        var userName = Users.getName(userId);
        var userFace = Users.getFace(userId);
        var friendName = Users.getName(friendId);
        var friendFace = Users.getFace(friendId);

        Activities.add(userId, ref.key, friendName, friendName + ' add you as friend', friendFace, '', 'private');
        Activities.add(friendId, ref.key, userName, userName + ' add you as friend', userFace, '', 'private');

        return $firebaseObject(ref.child(ref.key));
      });
    },
    update: function(chatId, type){
      var chatObj = $firebaseObject(ref.child(chatId));
      chatObj.type = type;
      chatObj.lastUpdate = firebase.database.ServerValue.TIMESTAMP;
      return chatObj.$save();
    },
    get: function(chatId){
      return $firebaseObject(ref.child(chatId));
    },
    getType: function(chatId){
      return chats.$getRecord(chatId).type;
    }
  }


})
.factory("Privates", function($firebaseArray, $firebaseObject) {
  var ref = firebase.database().ref().child("privates");
  var privates = $firebaseArray(ref);

  return {
    get: function(uId){
      return $firebaseObject(ref.child(uId));
    },
    add: function(uid, contactId, chatId){
      var privateObj = $firebaseObject(ref.child(uid).child(contactId));
      privateObj.chat = chatId;
      privateObj.$save();
    },
    remove: function(userId, contactId){
      var privateObj = $firebaseObject(ref.child(userId).child(contactId));
      privateObj.$remove();
    },
    check: function(uid, contactId){
      return $firebaseObject(ref.child(uid).child(contactId).child('chat'));
    },
    all: privates
  };

})
.factory('Messages', function( $firebaseArray, $firebaseObject, $ionicScrollDelegate, Chats, Users, Activities ){
  var ref = firebase.database().ref().child("messages");
  var messages = $firebaseArray(ref);

  return {
    addMessageAndUpdateActivities: function(chatId, messageObj, members){

      for(var i=0; i<members.length; i++){
        Activities.add(members[i].$id, chatId, '', messageObj.message, '', '', '');
      }
      return $firebaseArray(ref.child(chatId)).$add(messageObj);
    },
    addMessage: function(chatId, messageObj){

      return $firebaseArray(ref.child(chatId)).$add(messageObj);
    },
    getMessages: function(chatId){
      var messages = $firebaseArray(ref.child(chatId));
      messages.$watch(function (watch) {
        if (watch.event == "child_added") {
          $ionicScrollDelegate.scrollBottom(true);
        }
      });
      return messages;
    },
    remove: function(chatId){
      var messages = $firebaseArray(ref.child(chatId));
      return messages.$remove();
    },
    all:messages
  };
})
.factory('Wallets', function($firebaseArray, $firebaseObject, $q) {
  var ref = firebase.database().ref().child("wallets");

  return {
    all: function(userId){
      return $firebaseArray(ref.child(userId));
    },
    get: function(userId, walletAddressId){
      return $firebaseObject(ref.child(userId + '/' + walletAddressId));
    },
    /**
     * 対象ユーザーへ送金する
     * @param {Number} amount 送金額
     * @param {String} fromUserId 送金元の user id
     * @param {String} fromWalletId 送金元の wallet id
     * @param {String} toUserId 送金先の user id
     * @param {String} toWalletId 送金先の wallet id
     **/
    sendAsset: function(amount, fromUserId, fromWalletId, toUserId, toWalletId){
      var deferred1 = $q.defer();
      var deferred2 = $q.defer();

      this.get(fromUserId, fromWalletId).$loaded()
      .then(function(fromWallet){
        fromWallet.amount -= amount;
        console.log('fromWallet.amount', fromWallet.amount);
        fromWallet.$save().then(function(){
          deferred1.resolve(fromWallet);
        });
      });

      this.get(toUserId, toWalletId).$loaded()
      .then(function(toWallet){
        toWallet.amount += amount;
        console.log('toWallet.amount', toWallet.amount);
        toWallet.$save().then(function(){
          deferred2.resolve(toWallet);
        });
      });

      return $q.all([
        deferred1.promise,
        deferred2.promise
      ]);
    }
  };
})

.factory('toggleSelection', function() {
  // userObj: { id: 0, name: 'Venkman', face: 'img/venkman.jpg' }
  // selectedList: userObj list array
  // output: { groupName: [],  groupMember: [], groupFace: [] }
  return function(userObj, selectedList, output){
    if(userObj.checked){
      // only store 4 member
      if(selectedList.length == 4){
        selectedList.splice(0, 1);
      }
      selectedList.splice(3, 1, userObj);
    }
    else{
      if(selectedList.indexOf(userObj) != -1){
        selectedList.splice(selectedList.indexOf(userObj), 1);
      }
    }

    // update modal interface data
    output.groupName = [];
    output.groupMember = [];
    output.groupFace = [];
    for(var i=0; i<selectedList.length; i++){
      // only show 3 member name as group name
      // only show 3 face for group thumb
      if(i == 3){
        output.groupName.push('...');
        output.groupMember.push('...');
      }
      else{
        output.groupName.push(selectedList[i].name);
        output.groupMember.push(selectedList[i].name);
        output.groupFace.push(selectedList[i].face);
      }

    }
  }
});
