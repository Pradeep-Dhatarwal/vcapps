import h from './helpers.js';
window.addEventListener('load', ()=>{
    const room = document.querySelector("#sp_roomid").textContent;
    // const room = h.getQString(location.href, 'room');
    const username = document.querySelector("#username").value;
    //Start Sdp Control BandwidthHandler
    var BandwidthHandler = (function() {
        function setBAS(sdp, bandwidth, isScreen) {
            if (!!navigator.mozGetUserMedia || !bandwidth) {
                return sdp;
            }
    
            if (isScreen) {
                if (!bandwidth.screen) {
                    console.warn('It seems that you are not using bandwidth for screen. Screen sharing is expected to fail.');
                } else if (bandwidth.screen < 300) {
                    console.warn('It seems that you are using wrong bandwidth value for screen. Screen sharing is expected to fail.');
                }
            }
            // if screen; must use at least 300kbs
            if (bandwidth.screen && isScreen) {
                sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
                sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + bandwidth.screen + '\r\n');
            }
    
            // remove existing bandwidth lines
            if (bandwidth.audio || bandwidth.video || bandwidth.data) {
                sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
            }
    
            if (bandwidth.audio) {
                sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + bandwidth.audio + '\r\n');
            }
    
            if (bandwidth.video) {
                sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + (isScreen ? bandwidth.screen : bandwidth.video) + '\r\n');
            }
    
            return sdp;
        }
    
        // Find the line in sdpLines that starts with |prefix|, and, if specified,
        // contains |substr| (case-insensitive search).
        function findLine(sdpLines, prefix, substr) {
            return findLineInRange(sdpLines, 0, -1, prefix, substr);
        }
    
        // Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
        // and, if specified, contains |substr| (case-insensitive search).
        function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
            var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
            for (var i = startLine; i < realEndLine; ++i) {
                if (sdpLines[i].indexOf(prefix) === 0) {
                    if (!substr ||
                        sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
                        return i;
                    }
                }
            }
            return null;
        }
    
        // Gets the codec payload type from an a=rtpmap:X line.
        function getCodecPayloadType(sdpLine) {
            var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
            var result = sdpLine.match(pattern);
            return (result && result.length === 2) ? result[1] : null;
        }
    
        function setVideoBitrates(sdp, params) {
            params = params || {};
            var xgoogle_min_bitrate = params.min;
            var xgoogle_max_bitrate = params.max;
    
            var sdpLines = sdp.split('\r\n');
    
            // VP8
            var vp8Index = findLine(sdpLines, 'a=rtpmap', 'VP8/90000');
            var vp8Payload;
            if (vp8Index) {
                vp8Payload = getCodecPayloadType(sdpLines[vp8Index]);
            }
    
            if (!vp8Payload) {
                return sdp;
            }
    
            var rtxIndex = findLine(sdpLines, 'a=rtpmap', 'rtx/90000');
            var rtxPayload;
            if (rtxIndex) {
                rtxPayload = getCodecPayloadType(sdpLines[rtxIndex]);
            }
    
            if (!rtxIndex) {
                return sdp;
            }
    
            var rtxFmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + rtxPayload.toString());
            if (rtxFmtpLineIndex !== null) {
                var appendrtxNext = '\r\n';
                appendrtxNext += 'a=fmtp:' + vp8Payload + ' x-google-min-bitrate=' + (xgoogle_min_bitrate || '228') + '; x-google-max-bitrate=' + (xgoogle_max_bitrate || '228');
                sdpLines[rtxFmtpLineIndex] = sdpLines[rtxFmtpLineIndex].concat(appendrtxNext);
                sdp = sdpLines.join('\r\n');
            }
    
            return sdp;
        }
    
        function setOpusAttributes(sdp, params) {
            params = params || {};
    
            var sdpLines = sdp.split('\r\n');
    
            // Opus
            var opusIndex = findLine(sdpLines, 'a=rtpmap', 'opus/48000');
            var opusPayload;
            if (opusIndex) {
                opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
            }
    
            if (!opusPayload) {
                return sdp;
            }
    
            var opusFmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + opusPayload.toString());
            if (opusFmtpLineIndex === null) {
                return sdp;
            }
    
            var appendOpusNext = '';
            appendOpusNext += '; stereo=' + (typeof params.stereo != 'undefined' ? params.stereo : '1');
            appendOpusNext += '; sprop-stereo=' + (typeof params['sprop-stereo'] != 'undefined' ? params['sprop-stereo'] : '1');
    
            if (typeof params.maxaveragebitrate != 'undefined') {
                appendOpusNext += '; maxaveragebitrate=' + (params.maxaveragebitrate || 128 * 1024 * 8);
            }
    
            if (typeof params.maxplaybackrate != 'undefined') {
                appendOpusNext += '; maxplaybackrate=' + (params.maxplaybackrate || 128 * 1024 * 8);
            }
    
            if (typeof params.cbr != 'undefined') {
                appendOpusNext += '; cbr=' + (typeof params.cbr != 'undefined' ? params.cbr : '1');
            }
    
            if (typeof params.useinbandfec != 'undefined') {
                appendOpusNext += '; useinbandfec=' + params.useinbandfec;
            }
    
            if (typeof params.usedtx != 'undefined') {
                appendOpusNext += '; usedtx=' + params.usedtx;
            }
    
            if (typeof params.maxptime != 'undefined') {
                appendOpusNext += '\r\na=maxptime:' + params.maxptime;
            }
    
            sdpLines[opusFmtpLineIndex] = sdpLines[opusFmtpLineIndex].concat(appendOpusNext);
    
            sdp = sdpLines.join('\r\n');
            return sdp;
        }
    
        return {
            setApplicationSpecificBandwidth: function(sdp, bandwidth, isScreen) {
                return setBAS(sdp, bandwidth, isScreen);
            },
            setVideoBitrates: function(sdp, params) {
                return setVideoBitrates(sdp, params);
            },
            setOpusAttributes: function(sdp, params) {
                return setOpusAttributes(sdp, params);
            }
        };
    })();
	// end 

    if(!room){
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
    }

    else if(!username){
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
    }

    else{
        let commElem = document.getElementsByClassName('room-comm');

        for(let i = 0; i < commElem.length; i++){
            commElem[i].attributes.removeNamedItem('hidden');
        }

        var pc = [];

        let socket = io('/stream');

        var socketId = '';
        var myStream =  '';
        var screen = '';
        var recordedStream = [];
        var mediaRecorder = '';
        var bandwidth = {
            screen: 128, // 300kbits minimum
            video: 128   // 256kbits (both min-max)
        };
        var isScreenSharing = false;
        //Get user video by default
        getAndSetUserStream();


        socket.on('connect', ()=>{
            //set socketId
            socketId = socket.io.engine.id;
        

            socket.emit('subscribe', {
                room: room,
                socketId: socketId
            });


            socket.on('new user', (data)=>{
                socket.emit('newUserStart', {to:data.socketId, sender:socketId});
                pc.push(data.socketId);
                init(true, data.socketId);
            });


            socket.on('newUserStart', (data)=>{
                pc.push(data.sender);
                init(false, data.sender);
            });


            socket.on('ice candidates', async (data)=>{
                data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
            });


            socket.on('sdp', async (data)=>{
                if(data.description.type === 'offer'){
                    
                    data.description.sdp = BandwidthHandler.setApplicationSpecificBandwidth(data.description.sdp, bandwidth, isScreenSharing);
                    data.description.sdp = BandwidthHandler.setVideoBitrates(data.description.sdp, {
                        min: bandwidth.video,
                        max: bandwidth.video
                    });
                    data.description.sdp = BandwidthHandler.setOpusAttributes(data.description.sdp);
                    // data.description.sdp=h.setBandwidth(data.description.sdp,audioBandwidth,videoBandwidth);
                    data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                    h.getUserFullMedia().then(async (stream)=>{
                        if(!document.getElementById('local').srcObject){
                            h.setLocalStream(stream);
                        }

                        //save my stream
                        myStream = stream;

                        stream.getTracks().forEach((track)=>{
                            pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await pc[data.sender].createAnswer();
                        
                        await pc[data.sender].setLocalDescription(answer);

                        socket.emit('sdp', {description:pc[data.sender].localDescription, to:data.sender, sender:socketId});
                    }).catch((e)=>{
                        console.error(e);
                    });
                }

                else if(data.description.type === 'answer'){
                    data.description.sdp = BandwidthHandler.setApplicationSpecificBandwidth(data.description.sdp, bandwidth, isScreenSharing);
                    data.description.sdp = BandwidthHandler.setVideoBitrates(data.description.sdp, {
                        min: bandwidth.video,
                        max: bandwidth.video
                    });
                    data.description.sdp = BandwidthHandler.setOpusAttributes(data.description.sdp);
                    
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });

            socket.on('chat', (data)=>{
                h.addChat(data, 'remote');
            })
        });

        function init(createOffer, partnerName){
            pc[partnerName] = new RTCPeerConnection(h.getIceServer());
            
            if(screen && screen.getTracks().length){
                screen.getTracks().forEach((track)=>{
                    pc[partnerName].addTrack(track, screen);//should trigger negotiationneeded event
                });
            }

            else if(myStream){
                myStream.getTracks().forEach((track)=>{
                    pc[partnerName].addTrack(track, myStream);//should trigger negotiationneeded event
                });
            }

            else{
                h.getUserFullMedia().then((stream)=>{
                    //save my stream
                    myStream = stream;
    
                    stream.getTracks().forEach((track)=>{
                        pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
                    });
    
                    h.setLocalStream(stream);
                }).catch((e)=>{
                    console.error(`stream error: ${e}`);
                });
            }
            //create offer
            if(createOffer){
                pc[partnerName].onnegotiationneeded = async ()=>{
                    let offer = await pc[partnerName].createOffer();
                    
                    await pc[partnerName].setLocalDescription(offer);

                    socket.emit('sdp', {description:pc[partnerName].localDescription, to:partnerName, sender:socketId});
                };
            }
            //send ice candidate to partnerNames
            pc[partnerName].onicecandidate = ({candidate})=>{
                socket.emit('ice candidates', {candidate: candidate, to:partnerName, sender:socketId});
            };
            //add
            pc[partnerName].ontrack = (e)=>{
                let str = e.streams[0];
                if(document.getElementById(`${partnerName}-video`)){
                    document.getElementById(`${partnerName}-video`).srcObject = document.getElementById("local").srcObject;
                    document.getElementById("local").srcObject = str;
                }

                else{
                    //video elem
                    let newVid = document.createElement('video');
                    newVid.id = `${partnerName}-video`;            
                    newVid.srcObject = str;
                    newVid.autoplay = true;
                    newVid.className = 'remote-video-element ';
                    newVid.setAttribute("onclick", 'reptrack.call(this)');
                    newVid.setAttribute("playsinline", '');

                    //video controls elements
                    let controlDiv = document.createElement('div');
                    controlDiv.className = 'remote-video-controls videmax-icons';
               
                    controlDiv.innerHTML = `
                        <div class="icon btn btn-default">
                            <span class="material-icons expand-remote-video" title="Expand">
                                fullscreen
                            </span>
                        <span class="indicator"></span>
                        </div>
                        <div class="icon btn btn-primary">
                            <span class="material-icons mute-remote-mic" title="Mute">
                                mic
                            </span>
                        </div>`;
                    
                    //create a new div for card
                    // let cardDiv = document.createElement('div');
                    // cardDiv.className = '';
                    // cardDiv.appendChild(newVid);
                    // cardDiv.appendChild(controlDiv);
                    
                    //create a new div for everything
                    let div = document.createElement('div');
                    div.className = 'remote-video  videmax-card ';
                    div.id = partnerName;
                    div.appendChild(newVid);
                    div.appendChild(controlDiv);
                    
                    //put div in videos elem
                    document.getElementById('videos').prepend(div);
                }
            };
            pc[partnerName].onconnectionstatechange = (d)=>{
                switch(pc[partnerName].iceConnectionState){
                    case 'disconnected':
                    case 'failed':
                        h.closeVideo(partnerName);
                        break;
                        
                    case 'closed':
                        h.closeVideo(partnerName);
                        break;
                }
            };
            pc[partnerName].onsignalingstatechange = (d)=>{
                switch(pc[partnerName].signalingState){
                    case 'closed':
                        console.log("Signalling state is 'closed'");
                        h.closeVideo(partnerName);
                        break;
                }
            };
        }
        function getAndSetUserStream(){
            h.getUserFullMedia().then((stream)=>{
                //save my stream
                myStream = stream;
    
                h.setLocalStream(stream);
            }).catch((e)=>{
                console.error(`stream error: ${e}`);
            });
        }


        function sendMsg(msg){
            let data = {
                room: room,
                msg: msg,
                sender: username
            };

            //emit chat message
            socket.emit('chat', data);


            //add localchat
            h.addChat(data, 'local');
        }
        function shareScreen(){
            h.shareScreen().then((stream)=>{
                h.toggleShareIcons(true);

                //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
                //It will be enabled was user stopped sharing screen
                h.toggleVideoBtnDisabled(true);

                //save my screen stream
                screen = stream;

                //share the new stream with all partners
                broadcastNewTracks(stream, 'video', false);

                //When the stop sharing button shown by the browser is clicked
                screen.getVideoTracks()[0].addEventListener('ended', ()=>{
                    stopSharingScreen();
                });
            }).catch((e)=>{
                console.error(e);
            });
        }
        function stopSharingScreen(){
            //enable video toggle btn
            h.toggleVideoBtnDisabled(false);

            return new Promise((res, rej)=>{
                screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';

                res();
            }).then(()=>{
                h.toggleShareIcons(false);
                broadcastNewTracks(myStream, 'video');
            }).catch((e)=>{
                console.error(e);
            });
        }



        function broadcastNewTracks(stream, type, mirrorMode=true){
            h.setLocalStream(stream, mirrorMode);

            let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

            for(let p in pc){
                let pName = pc[p];
                
                if(typeof pc[pName] == 'object'){
                    h.replaceTrack(track, pc[pName]);
                }
            }
        }


        function toggleRecordingIcons(isRecording){
            let e = document.getElementById('record');

            if(isRecording){
                e.setAttribute('title', 'Stop recording');
                e.children[0].classList.add('text-danger');
                e.children[0].classList.remove('text-white');
            }

            else{
                e.setAttribute('title', 'Record');
                e.children[0].classList.add('text-white');
                e.children[0].classList.remove('text-danger');
            }
        }


        function startRecording(stream){
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            mediaRecorder.start(1000);
            toggleRecordingIcons(true);

            mediaRecorder.ondataavailable = function(e){
                recordedStream.push(e.data);
            }

            mediaRecorder.onstop = function(){
                toggleRecordingIcons(false);

                h.saveRecordedStream(recordedStream, username);

                setTimeout(()=>{
                    recordedStream = [];
                }, 3000);
            }

            mediaRecorder.onerror = function(e){
                console.error(e);
            }
        }


        //Chat textarea
        document.getElementById('chat-input').addEventListener('keypress', (e)=>{
            if(e.which === 13 && (e.target.value.trim())){
                e.preventDefault();
                
                sendMsg(e.target.value);

                setTimeout(()=>{
                    e.target.value = '';
                }, 50);
            }
        });


        //When the video icon is clicked
        document.getElementById('toggle-video').addEventListener('click', (e)=>{
            e.preventDefault();

            let elem = document.getElementById('toggle-video');
            
            if(myStream.getVideoTracks()[0].enabled){
                e.target.innerHTML = 'videocam_off';
                elem.setAttribute('title', 'Show Video');
                myStream.getVideoTracks()[0].enabled = false;
            }

            else{
                e.target.innerHTML = 'videocam';
                elem.setAttribute('title', 'Hide Video');
                myStream.getVideoTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'video');
        });


        //When the mute icon is clicked
        document.getElementById('toggle-mute').addEventListener('click', (e)=>{
            e.preventDefault();

            let elem = document.getElementById('toggle-mute');
            
            if(myStream.getAudioTracks()[0].enabled){
                // e.target.classList.remove('fa-microphone-alt');
                e.target.innerHTML = 'mic_off' ;
                elem.setAttribute('title', 'Unmute');
                myStream.getAudioTracks()[0].enabled = false;
            }

            else{
                // e.target.classList.remove('fa-microphone-alt-slash');
                e.target.innerHTML = 'mic';
                elem.setAttribute('title', 'Mute');
                myStream.getAudioTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'audio');
        });


        //When user clicks the 'Share screen' button
        document.getElementById('share-screen').addEventListener('click', (e)=>{
            e.preventDefault();

            if(screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended'){
                stopSharingScreen();
            }

            else{
                shareScreen();
            }
        });


        //When record button is clicked
        document.getElementById('record').addEventListener('click', (e)=>{
            /**
             * Ask user what they want to record.
             * Get the stream based on selection and start recording
             */
            if(!mediaRecorder || mediaRecorder.state == 'inactive'){
                h.toggleModal('recording-options-modal', true);
            }

            else if(mediaRecorder.state == 'paused'){
                mediaRecorder.resume();
            }

            else if(mediaRecorder.state == 'recording'){
                mediaRecorder.stop();
            }
        });


        //When user choose to record screen
        document.getElementById('record-screen').addEventListener('click', ()=>{
            h.toggleModal('recording-options-modal', false);

            if(screen && screen.getVideoTracks().length){
                startRecording(screen);
            }

            else{
                h.shareScreen().then((screenStream)=>{
                    startRecording(screenStream);
                }).catch(()=>{});
            }
        });


        //When user choose to record own video
        document.getElementById('record-video').addEventListener('click', ()=>{
            h.toggleModal('recording-options-modal', false);
            
            if(myStream && myStream.getTracks().length){
                startRecording(myStream);
            }

            else{
                h.getUserFullMedia().then((videoStream)=>{
                    startRecording(videoStream);
                }).catch(()=>{});
            }
        });
    }
});