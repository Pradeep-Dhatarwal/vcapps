export default {
    generateRandomString(){
        return Math.random().toString(36).slice(2).substring(0, 15);
    },


    closeVideo(elemId){
        if(document.getElementById(elemId)){
            document.getElementById(elemId).remove();
        }
    },


    pageHasFocus(){
        return !(document.hidden || document.onfocusout || window.onpagehide || window.onblur);
    },


    getQString(url='', keyToReturn=''){
        url = url ? url : location.href;
        let queryStrings = decodeURIComponent(url).split('#', 2)[0].split('?', 2)[1];
        
        if(queryStrings){
            let splittedQStrings = queryStrings.split('&');
            
            if(splittedQStrings.length){
                let queryStringObj = {};
                
                splittedQStrings.forEach(function(keyValuePair){
                    let keyValue = keyValuePair.split('=', 2);
                    
                    if(keyValue.length){
                        queryStringObj[keyValue[0]] = keyValue[1];
                    }
                });            
                
                return keyToReturn ? (queryStringObj[keyToReturn] ? queryStringObj[keyToReturn] : null) : queryStringObj;
            }
            
            return null;
        }
        
        return null;
    },


    userMediaAvailable(){
        return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    },


    getUserFullMedia(){
        if(this.userMediaAvailable()){
            return navigator.mediaDevices.getUserMedia({
                video: true, 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
        }

        else{
            throw new Error('User media not available');
        }
    },


    getUserAudio(){
        if(this.userMediaAvailable()){
            return navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
        }

        else{
            throw new Error('User media not available');
        }
    },



    shareScreen(){
        if(this.userMediaAvailable()){
            return navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
        }

        else{
            throw new Error('User media not available');
        }
    },


    getIceServer(){
        // "turns:eu-turn4.xirsys.com:5349?transport=tcp"
        // "turns:eu-turn4.xirsys.com:443?transport=tcp"
        // "turn:eu-turn4.xirsys.com:80?transport=tcp",
        // "turn:eu-turn4.xirsys.com:3478?transport=udp",
        return {
            iceServers: [
                {
                    urls: ["stun:eu-turn4.xirsys.com"]
                }, 
                {
                    username: "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl", 
                    credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
                    urls: [
                        "turn:eu-turn4.xirsys.com:80?transport=udp",                         
                        "turn:eu-turn4.xirsys.com:3478?transport=tcp"
                    ]
                }
            ]
        };
    },
    
    
    addChat(data, senderType){
        let chatMsgDiv = document.querySelector('#chat-messages');
        let contentAlign = 'justify-content-end';
        let senderName = 'You';
        let msgBg = 'bg-white';

        if(senderType === 'remote'){
            contentAlign = 'justify-content-start';
            senderName = data.sender;
            msgBg = '';

            this.toggleChatNotificationBadge();
        }

        let infoDiv = document.createElement('div');
        infoDiv.className = 'sender-info';
        infoDiv.innerHTML = `${senderName} - ${moment().format('Do MMMM, YYYY h:mm a')}`;

        let colDiv = document.createElement('div');
        colDiv.className = `col-10 card chat-card msg ${msgBg}`;
        colDiv.innerHTML =  data.msg;

        let rowDiv = document.createElement('div');
        rowDiv.className = `row ${contentAlign} mb-2`;


        colDiv.appendChild(infoDiv);
        rowDiv.appendChild(colDiv);

        chatMsgDiv.appendChild(rowDiv);

        /**
         * Move focus to the newly added message but only if:
         * 1. Page has focus
         * 2. User has not moved scrollbar upward. This is to prevent moving the scroll position if user is reading previous messages.
         */
        if(this.pageHasFocus){
            rowDiv.scrollIntoView();
        }
    },


    toggleChatNotificationBadge(){
        if(document.querySelector('#chat-pane').classList.contains('chat-opened')){
            document.querySelector('#new-chat-notification').setAttribute('hidden', true);
        }

        else{
            document.querySelector('#new-chat-notification').removeAttribute('hidden');
        }
    },



    replaceTrack(stream, recipientPeer){
        let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false;
        
        sender ? sender.replaceTrack(stream) : '';
    },



    toggleShareIcons(share){
        let shareIconElem = document.querySelector('#share-screen');
        
        if(share){
            shareIconElem.setAttribute('title', 'Stop sharing screen');
            shareIconElem.children[0].classList.add('text-primary');
            shareIconElem.children[0].classList.remove('text-white');
        }

        else{
            shareIconElem.setAttribute('title', 'Share screen');
            shareIconElem.children[0].classList.add('text-white');
            shareIconElem.children[0].classList.remove('text-primary');
        }
    },


    toggleVideoBtnDisabled(disabled){
        document.getElementById('toggle-video').disabled = disabled;
    },


    maximiseStream(e){
        document.querySelector('#close-single-peer-btn').style.display = 'block';

        e.target.parentElement.previousElementSibling.classList.remove('remote-video');
        e.target.parentElement.previousElementSibling.classList.add('single-peer-video');

        //hide the other elements
        let remoteVideoElems = document.getElementsByClassName('remote-video');

        if(remoteVideoElems.length){
            for(let i = 0; i < remoteVideoElems.length; i++){
                remoteVideoElems[i].style.display = 'none';
            }
        }
    },


    singleStreamToggleMute(e){
        if(e.target.classList.contains('fa-microphone')){
            e.target.parentElement.previousElementSibling.muted = true;
            e.target.classList.add('fa-microphone-slash');
            e.target.classList.remove('fa-microphone');
        }

        else{
            e.target.parentElement.previousElementSibling.muted = false;
            e.target.classList.add('fa-microphone');
            e.target.classList.remove('fa-microphone-slash');
        }
    },


    saveRecordedStream(stream, user){
        let blob = new Blob(stream, {type:'video/webm'});

        let file = new File([blob], `${user}-${moment().unix()}-record.webm`);

        saveAs(file);
    },


    toggleModal(id, show){
        let el = document.getElementById(id);
        
        if(show){             
            el.style.display = 'block';
            el.removeAttribute('aria-hidden');
        }

        else{
            el.style.display = 'none';
            el.setAttribute('aria-hidden', true);
        }
    },



    setLocalStream(stream, mirrorMode=true){
        const localVidElem = document.getElementById('local');
        
        localVidElem.srcObject = stream;
        mirrorMode ? localVidElem.classList.add('mirror-mode') : localVidElem.classList.remove('mirror-mode');
    }
};