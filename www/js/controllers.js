angular.module('starter.controllers', [])
.controller('ChatsCtrl', function($scope, Activities, ModalService, Users, activities) {

  // Tab Chats show last Activities
  $scope.activities = activities;

  $scope.remove = function(chat) {
    // Activities.remove(chat);
  };

  // Top right button that create new private chat
  $scope.newChat = function() {
    ModalService
      .init('templates/modal/new-chat.html', $scope)
      .then(function(modal) {
        modal.show();
        Users.all.$loaded(function(users){
          $scope.users = users;
        });
        $scope.linkType = "contacts";
      });
  };
})

.controller('ChatCtrl', function($scope, $stateParams, $rootScope,
  Activities, Messages, ModalService, Users,
  chat, messages, members, activity,
  currentWallets, membersWallets,
  Loading, linkType, $http) {

  // link of chat-detail
  $scope.linkType = linkType;

  // message list and chat name
  $scope.messages = messages;
  $scope.activity = activity;

  // chat members
  $scope.members = members;

  // wallets
  $scope.currentWallets = currentWallets;
  $scope.membersWallets = membersWallets;

  // user send new message
  $scope.sendChat = function(chatText){

    // message obj
    var message = {
      userId: $rootScope.currentUser.$id,
      name: $rootScope.currentUser.name,
      face: $rootScope.currentUser.face,
      message: chatText,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    // send Message
    Messages.addMessageAndUpdateActivities($scope.activity.$id, message, $scope.members);

  }

  // asset の送付モーダル画面を開く
  $scope.openAssetModal = function() {
    ModalService
      .init('templates/modal/send-asset.html', $scope)
      .then(function(modal) {
        modal.show();
      });
  };

  // チャット内の相手 user に財を送る
  $scope.sendAsset = function(assetNumber){
    // 財の送り元/先の Wallet
    // FIXME: 決め打ちで0番目の要素を利用している
    var fromWallet = $scope.currentWallets[0];
    var toWallet = $scope.membersWallets[0];

    if (fromWallet.assetId !== toWallet.assetId) {
      console.error("Does not match assetId");
      return;
    }

    var apiJsonData = {
      fromAddress: fromWallet.$id,
      toAddress: toWallet.$id,
      amount: assetNumber,
      assetId: fromWallet.assetId
    };

    // TODO services に API を呼び出す処理を移行する
    $http({
      method: "POST",
      url: "/colu_api/send_asset",
      data: apiJsonData
    })
    .success(function(data, status, headers, config){
      console.log("success");
      console.log(data, status, headers, config);

      $scope.sendChat(assetNumber + " コイン送金しました。");
      $scope.closeModal();
    })
    .error(function(data, status, headers, config){
      console.log("error");
      console.log(data, status, headers, config);
    });
  };

})

.controller('ChatDetailCtrl', function($scope, $stateParams, Activities, Members, ModalService, Users, $filter, $ionicHistory, toggleSelection,
activity, members, Chats, Privates, $state, $rootScope) {

  // get activity
  $scope.activity = activity;

  // convert activity.face string to thumbs array
  if($scope.activity.face){
    $scope.thumbs = $filter('split')($scope.activity.face);
  }

  // chatMember store current chat member list
  $scope.chatMember = [];
  $scope.members = members;
  for(var i=0; i<$scope.members.length; i++){
    $scope.chatMember.push(Users.get($scope.members[i].$id));
  }

  $scope.newGroup = function() {
    ModalService
      .init('templates/modal/new-group.html', $scope)
      .then(function(modal) {
        modal.show();

        // init new group modal data
        $scope.modalView = {};
        $scope.modalView.groupMember = $scope.activity.members;
        $scope.modalView.groupName = $scope.activity.name;
        $scope.modalView.groupFace = $scope.activity.face;

        // get user list
        Users.all.$loaded(function(contacts){

          // user list
          $scope.contacts = contacts;
          for(var i=0; i<$scope.contacts.length; i++){
            $scope.contacts[i].checked = null;
          }

          // set current chat member checked
          // selectedMember store checkbox member select
          $scope.selectedMember = [];
          for(var i=0; i<$scope.members.length; i++){
            for(var j=0; j<$scope.contacts.length; j++){
              if($scope.members[i].$id == $scope.contacts[j].$id){
                $scope.contacts[j].checked = true;
                $scope.selectedMember.push($scope.contacts[j]);
              }
            }
          }

        });


      });
  };

  $scope.toggleSelection = function(obj){
    return toggleSelection(obj, $scope.selectedMember, $scope.modalView);
  }

  $scope.createNewGroup = function(){
    // must 3 people can create group
    if($scope.selectedMember.length > 2){
      var name, lastText, face, members, chatType;

      // if multiple member select,
      // make name, face and members data
      // based on these members info
      if(Array.isArray($scope.modalView.groupName)){
        name = $scope.modalView.groupName.join(", ");
      }
      else {
          name = $scope.modalView.groupName;
      }

      if(Array.isArray($scope.modalView.groupFace)){
        face = $scope.modalView.groupFace.join(", ");
      }
      else {
          face = $scope.modalView.groupFace;
      }

      if(Array.isArray($scope.modalView.groupMember)){
        members = $scope.modalView.groupMember.join(", ");
      }
      else {
          members = $scope.modalView.groupMember;
      }

      lastText = $rootScope.currentUser.name + " created the group";
      chatType = "group";
      Chats.update($scope.activity.$id, chatType);

      // remove private reference
      if($scope.members.length == 2){
        Privates.remove($scope.members[0].$id, $scope.members[1].$id);
        Privates.remove($scope.members[1].$id, $scope.members[0].$id);
      }


      // update Activities services
      for(var i=0; i<$scope.selectedMember.length; i++){
        Activities.add($scope.selectedMember[i].$id, $scope.activity.$id, name, lastText, face, members, chatType);
      }

      Activities.get($rootScope.currentUser.$id, $scope.activity.$id).$loaded(function(activities){
        $scope.activity = activities;
      });

      $scope.thumbs = $filter('split')(face);

      // update current chat members list
      $scope.chatMember = $scope.selectedMember;

      // update members service
      var memberIdList = [];
      for(var i=0; i<$scope.selectedMember.length; i++){
        memberIdList.push($scope.selectedMember[i].$id);
        Members.addMember($scope.activity.$id, $scope.selectedMember[i].$id);
      }

      // close
      $scope.closeModal();
      $ionicHistory.clearCache();

    }
  }
})

.controller('GroupsCtrl', function(Chats, $scope, Activities, Users, ModalService, $filter, Members, toggleSelection, $state, $ionicHistory, Messages, activities, $rootScope) {
  // get group list
  $scope.groups = activities;

  $scope.new_group = function() {
    ModalService
      .init('templates/modal/new-group.html', $scope)
      .then(function(modal) {
        modal.show();

        // init new group modal data
        $scope.modalView = {};

        // get user list
        Users.all.$loaded(function(contacts){

          $scope.contacts = contacts;
          for(var i=0; i<$scope.contacts.length; i++){
            $scope.contacts[i].checked = null;
          }

          // set current chat member checked
          // selectedMember store checkbox member select
          $scope.selectedMember = [];
          Users.get($rootScope.currentUser.$id).$loaded(function(me){
            $scope.selectedMember.push(me);
          });

          console.log($scope.selectedMember);

        });

      });
  };


  $scope.toggleSelection = function(obj){
    return toggleSelection(obj, $scope.selectedMember, $scope.modalView);
  }

  $scope.createNewGroup = function(){
    // must 3 people can create group
    if($scope.selectedMember.length > 2){
      var name, lastText, face, members, chatType;

      // if multiple member select,
      // make name, face and members data
      // based on these members info
      if(Array.isArray($scope.modalView.groupName)){
        name = $scope.modalView.groupName.join(", ");
      }
      else {
          name = $scope.modalView.groupName;
      }

      if(Array.isArray($scope.modalView.groupFace)){
        face = $scope.modalView.groupFace.join(", ");
      }
      else {
          face = $scope.modalView.groupFace;
      }

      if(Array.isArray($scope.modalView.groupMember)){
        members = $scope.modalView.groupMember.join(", ");
      }
      else {
          members = $scope.modalView.groupMember;
      }

      lastText = $rootScope.currentUser.name + " created the group";
      chatType = "group";

      Chats.newGroup($scope.selectedMember).then(function(chat){

        // update Activities services
        for(var i=0; i<$scope.selectedMember.length; i++){
          Activities.add($scope.selectedMember[i].$id, chat.$id, name, lastText, face, members, chatType);
        }

        Activities.get($rootScope.currentUser.$id, chat.$id).$loaded(function(activities){
          $scope.chat = activities;

          // close
          $ionicHistory.clearCache();
          $scope.closeModal();
          $state.go("tab.group", { "groupId": $scope.chat.$id});
        });
      });

    }
  }
})

.controller('ContactsCtrl', function($scope, contacts, $ionicPopup) {
  // get user list
  $scope.users = contacts;

  // add contact
  $scope.showPromptAdd = function () {
    $ionicPopup.prompt({
        title: 'Invite to Messenger',
        template: 'Enter someone\'s email to invite them on Messenger',
        inputType: 'email',
        inputPlaceholder: 'Email',
        okText: 'Send',
      }
    )
    .then(function (res) {
        console.log('Your password is', res);
    });
  }
})

.controller('AccountCtrl', function($scope, Auth) {
  $scope.signOut = function (){
    return Auth.$signOut();
  };
});
