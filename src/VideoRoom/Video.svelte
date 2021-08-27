<script lang="ts">
import { onMount } from "svelte";

    import {location,querystring, replace} from 'svelte-spa-router';
    import firebase from "firebase/app";
    import 'firebase/firestore'; 
    import {isInitiator} from '../stores';
    import { notifications } from "../UIUtils/notification";
    import Toast from '../UIUtils/Toast.svelte';
    import VideoSetup from './VideoSetup.svelte'
    export const initiater = false;



    //getting id of the current room from the url

    const firestore = firebase.firestore();
    let callButton ;
    let answerButton;
    let webcamVideo;
    let remoteVideo;
    let hangupButton;
    let isCallOngoing = false;
    let arePermissionsGranted = false;
    let isLocalCamOn  = false;
    let isLocalMicOn = false;
    let sender ;
    $: {
        console.log('arePermissionsGranted',arePermissionsGranted);
    }
    const id = $location.substring(1);
    $:{
        console.log('id',id);
    }
    let localStream = null;
    let remoteStream = null;

    let localCamButton ;
    //initialising the RTC Peerconnection 
    const servers = {
    iceServers: [
        {   
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
    };

    const configuration = {
        offerToReceiveAudio: false,
        offerToReceiveVideo: true
    }
    const pc = new RTCPeerConnection(servers);
    pc.onconnectionstatechange = function(event) {
                const connection = pc.connectionState;
                console.log('connection',connection);
                if(connection==='disconnected'){
                    console.log('closed')
                    pc.close();
                    replace("/");
                }
                
    }

    console.log('compontnt initialised')
    let isFirst :Boolean= null;
    isInitiator.subscribe(value=>{
        isFirst = value;
    })

    const checkForRommAvailable= async() =>{
        if(!isFirst){
            const callDoc = firestore.collection('calls').doc(`${id}`);

            const docSnapshot = await callDoc.get();
            console.log('Got room: ', docSnapshot.exists);
            if(docSnapshot.exists){
                //document exists ... now we check whether the room is full or not
                const answer = docSnapshot.data().answer;
                console.log('answer',answer);
                if(answer !== undefined){
                    replace("/");
                }
            }else{
                //document does not exist ... the session is ended
                replace("/");
            }
        }

    }

    checkForRommAvailable().then(()=>{console.log('checked for room availablity')})

    onMount(()=>{

        callButton.disabled = false;
        answerButton.disabled = false;

        const handleWebButtonClick= async() =>{
        
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            remoteStream = new MediaStream();

            // Push tracks from local stream to peer connection
            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });

            // Pull tracks from remote stream, add to video stream
            pc.ontrack = (event) => {
                isCallOngoing = true;
                event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
                });
            };
            

            webcamVideo.srcObject = localStream;
            remoteVideo.srcObject = remoteStream;


        }

       

        const handleCreateCall= async() =>{
            // Reference Firestore collections for signaling
            const callDoc = firestore.collection('calls').doc(`${id}`);
            const offerCandidates = callDoc.collection('offerCandidates');
            const answerCandidates = callDoc.collection('answerCandidates');


            // Get candidates for caller, save to db
            pc.onicecandidate = (event) => {
                console.log('on iceCandidatePoolSize')
                event.candidate && offerCandidates.add(event.candidate.toJSON());
            };
            
              
            // Create offer
            const offerDescription = await pc.createOffer();
            await pc.setLocalDescription(offerDescription);
            console.log('offer created')
            const offer = {
                sdp: offerDescription.sdp,
                type: offerDescription.type,
             };

            await callDoc.set({ offer });
            console.log('offer set')
            // Listen for remote answer
            callDoc.onSnapshot((snapshot) => {
                const data = snapshot.data();
                if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
                console.log('document changed')
                }
            });

            // When answered, add candidate to peer connection
            answerCandidates.onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                    console.log('ansercandidates added')
                }
                });
            });

            hangupButton.disabled = false;
            notifications.success('Call Initiated, send the link to your peer',3000);
        }

        callButton.onclick = handleCreateCall;


    

        // 3. Answer the call with the unique ID
        const answerHandle = async () => {
            await handleWebButtonClick()
            const callDoc = firestore.collection('calls').doc(`${id}`);
            const answerCandidates = callDoc.collection('answerCandidates');
            const offerCandidates = callDoc.collection('offerCandidates');

            pc.onicecandidate = (event) => {
                event.candidate && answerCandidates.add(event.candidate.toJSON());
            };

            const callData = (await callDoc.get()).data();

            const offerDescription = callData.offer;
            await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            const answer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
            };

            await callDoc.update({ answer });

            offerCandidates.onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                console.log(change);
                if (change.type === 'added') {
                    let data = change.doc.data();
                    pc.addIceCandidate(new RTCIceCandidate(data));
                }
                });
            });
        };
        
        answerButton.onclick = answerHandle;
        handleWebButtonClick().then(()=>{ 
            console.log('web videos loaded')
            arePermissionsGranted = true;
            isLocalCamOn = true;
            isLocalMicOn = true;
             
            if(!isFirst){
                
                answerHandle().then(()=>{
                    console.log('answer handled');
                }).catch((error)=>{
                    console.log(error);
                    
                    notifications.danger('Call Cannot be answered due to network issues',3000);
                    replace("/");
                })

            }

        }).catch(err =>{
            if(err.name === "NotAllowedError"){
                notifications.danger('Please allow camera and microphone permissions', 3000)
                console.log('error',err)
                return;
            }
            console.log(err)
        })
       
        localCamButton.onclick = async() =>{

            
           
        }

        //Hangup call
         hangupButton.onclick = async() =>{
            firestore.collection('calls').doc(`${id}`)
            .delete().then(()=>{
                console.log("Document successfully deleted!");
            }).catch((error) => {
                console.error("Error removing document: ", error);
            });
            pc.close();
            replace("/");
         }  
         
      

    })


</script>
<div hidden='{arePermissionsGranted.valueOf()}'>
    <VideoSetup bind:arePermissionsGranted={arePermissionsGranted} />
</div>

<div hidden='{!arePermissionsGranted.valueOf()}' class="content">
    <div class="videos">
        <div class="local">
            <h3>Local Stream</h3>
            <!-- svelte-ignore a11y-media-has-caption -->
            <div class="divVideo">
                <video id="webcamVideo" bind:this={webcamVideo} autoplay playsinline></video>
                <div class="buttons">
                    <img   class:isLocalCamOn = {isLocalCamOn} bind:this = {localCamButton} src="assets/cam_settings/cam_off.svg" alt="hello" />
                    <img  class:isLocalMicOn = {isLocalMicOn} type="image"  src="/assets/cam_settings/mic_off.svg" alt="hello" />
                </div>
            </div>
        </div>
        <div class="remote">
            <div class="divVideo">
                <h3>Remote Stream</h3>
                <!-- svelte-ignore a11y-media-has-caption -->
                <video id="remoteVideo" bind:this={remoteVideo} autoplay playsinline></video>
                <div class="buttons">
                    <img  class="settingsImage" type="image"  src="assets/cam_settings/cam_on.svg" alt="hello" />
                    <img   class="settingsImage" type="image"  src="/assets/cam_settings/mic_on.svg" alt="hello" />
                </div>
            </div>
        </div>
        
    </div>
    <Toast />
    <div class = "divCallButton ">
        <button id="callButton" bind:this={callButton} hidden='{!isFirst.valueOf() || isCallOngoing.valueOf()}'>Start Call</button>
        <button id="answerButton" bind:this={answerButton}
        hidden='{isFirst.valueOf() || isCallOngoing.valueOf()}'>Answer</button>
        <button id="hangupButton" bind:this={hangupButton} hidden='{!isCallOngoing.valueOf()}'>Hangup</button>
    </div>

   
</div>

<style>
    h3 {
    font-family: Inter;
      font-style: normal;
      font-weight: bold;
      font-size: 24px;
      line-height: 24px;
    }
    .content{
        width: 100%;
        margin :0 auto;
        display:flex;
        justify-content: space-evenly;
        flex-direction: column;
        flex-wrap: wrap;
    }
    .videos{
        flex-grow: 8;
        width: 100%;
        margin :0 auto;
        display:flex;
        justify-content: space-evenly;
        flex-wrap: wrap;
    }
   
    #webcamVideo {
        max-height: 300px;
        max-width : 400px;
        border-radius: 12px;
        border: 2px solid black;
    }

    #remoteVideo {
        max-height: 300px;
        max-width : 400px;
        border-radius: 12px;
        border: 2px solid black;
    }

    #callButton,#answerButton,#hangupButton {
      /* Auto Layout */
      cursor: pointer;
      width: 200px;
      height: 48px;
      border:0px;
      border-radius: 3px;

      /* Black */

      background: #0F172A;
      /*font*/
      /* Body / Bold */

      font-family: Inter;
      font-style: normal;
      font-weight: bold;
      font-size: 16px;
      line-height: 24px;

      /* identical to box height, or 150% */

      font-feature-settings: 'tnum' on, 'lnum' on;

      /* White */

      color: #FFFFFF;
    }

    #callButton:active,#answerButton:active,#hangupButton:active {
      background-color: #FFFFFF;
      color: #0F172A;
      transform: translateY(4px);
    }

    .divVideo {position: relative; width: 350px;}
    .divVideo #webcamVideo {display: block;}
    .divVideo .buttons {position: absolute; bottom: 0; z-index: 1; width: 100%; text-align: center;}
    .divVideo:hover .buttons {display: block;}

    .divCallButton {
        flex-grow:2;
        display:flex;
        justify-content:center;
        margin:10px;
    }
    .divCallButton button {
        margin: 10px;
    }
     .isLocalMicOn{
        content:url("/assets/cam_settings/mic_on.svg")
     }

     .isLocalCamOn{
        content:url("/assets/cam_settings/cam_on.svg")
     }

</style>