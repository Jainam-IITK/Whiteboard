<script lang="ts">
    import {notifications} from '../UIUtils/notification'
    import {onMount} from "svelte"
    //import CamOff from './cam_off.svelte';
    let isCamOn = false;
    let isMicOn = false;

    export let arePermissionsGranted :Boolean = isCamOn && isMicOn ;

    $:{
        arePermissionsGranted = isCamOn && isMicOn;
    }
    let webcamVideo;
   
    async function askForPermissions() {
        if(arePermissionsGranted)return;
        try{
            webcamVideo.srcObject = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            isCamOn = true;
            isMicOn = true;
        }catch(err){
            if(err.name === "NotAllowedError"){
                notifications.danger('Please allow camera and microphone permissions', 3000)
                console.log('error',err)
                return;
            }
            console.log(err)
        }
    }[]

    onMount(()=>{
        askForPermissions().then(()=>{
            console.log('permissions request complete')
        })
    })
</script>

<div>
    <!-- svelte-ignore a11y-media-has-caption -->
    <!-- {#if !isCamOn }
      <img src="../src/assets/cam_settings/cam_off.svg" alt="Off" width="400" height = "300" >
    {:else} -->

    <video id="webcamVideo" bind:this = {webcamVideo} autoplay playsinline></video>
    
    <img id = "cam_setting" class="settingsImage" type="image" on:click={async()=>{await askForPermissions()}} src="assets/cam_settings/cam_off.svg" alt="hello" class:isCamOn = {isCamOn}/>
    <img id = "mic_setting"  class="settingsImage" type="image" on:click={()=>{console.log('hey man')}} src="/assets/cam_settings/mic_off.svg" alt="hello" class:isMicOn = {isMicOn}/>
</div>

<style >
    
    .settingsImage{
        cursor:pointer;
        height:48px;
        width:48px;
    }

    .isMicOn{
        content:url("/assets/cam_settings/mic_on.svg")
    }

    .isCamOn{
        content:url("/assets/cam_settings/cam_on.svg")

    }

    #webcamVideo{
        max-height: 300px;
        max-width : 400px;
        border-radius: 12px;
        border: 2px solid black;
    }

</style>
