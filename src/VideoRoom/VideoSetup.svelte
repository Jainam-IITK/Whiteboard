<script lang="ts">
    import {notifications} from '../UIUtils/notification'
    import {onMount} from "svelte"
    import {isMicPermissionGranted,isCamPermissionGranted,arePermissionsGranted} from '../stores/MicAndCamPermissionStore'
    import {MediaPermissionsError,MediaPermissionsErrorType,requestMediaPermissions} from 'mic-check';
    //import CamOff from './cam_off.svelte';
    
    //this variable is exported outside to tell other components about 
    //mic and cam permission grant situation


    //web cam video variable which binds to the video element
    let webcamVideo;
   
    // asks for permission for camera and mic
    // if granted -> isCamOn and isMicOn are switched to true
    // if not granted --> notification is showed and console error is thrown
    async function askForPermissions() {
        if($arePermissionsGranted)return;
        
        requestMediaPermissions().then(async () => {
		// can successfully access camera and microphone streams
        isCamPermissionGranted.set(true);
        isMicPermissionGranted.set(true);
        webcamVideo.srcObject = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        
       
	   })
	  .catch((err: MediaPermissionsError) => {
        console.log(err);
		const { type, name, message } = err;
		if (type === MediaPermissionsErrorType.SystemPermissionDenied) {
			// browser does not have permission to access camera or microphone
            notifications.danger(' browser does not have permission to access camera or microphone ', 3000)
		} else if (type === MediaPermissionsErrorType.UserPermissionDenied) {
			// user didn't allow app to access camera or microphone
            notifications.danger('user didn\'t allow app to access camera or microphone ', 3000)

		} else if (type === MediaPermissionsErrorType.CouldNotStartVideoSource) {
			// camera is in use by another application (Zoom, Skype) or browser tab (Google Meet, Messenger Video)
			// (mostly Windows specific problem)
            notifications.danger('camera is in use by another application (Zoom, Skype) or browser tab (Google Meet, Messenger Video) ', 3000)

		} else {
			// not all error types are handled by this library
            notifications.danger('unknown error, please try again later',3000)
		}
	});

        // try{
        //     webcamVideo.srcObject = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            
        //     isCamPermissionGranted.set(true);
        //     isMicPermissionGranted.set(true);
        // }catch(err){
        //     if(err.name === "NotAllowedError"){
        //         notifications.danger('Please allow camera and microphone permissions', 3000)
        //         console.log('error',err)
        //         return;
        //     }
        //     console.log(err)
        // }
    }[]

    // when this Component is mounted , we ask for permission
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

    <!-- shows our video feed in a video element -->
    <video id="webcamVideo" bind:this = {webcamVideo} autoplay playsinline></video>
       
    <!-- shows our camera on/off switch -->
    <img id = "cam_setting" class="settingsImage" type="image" on:click={async()=>{await askForPermissions()}} src="assets/cam_settings/cam_off.svg" alt="hello" class:isCamOn = {$isCamPermissionGranted}/>
    
    <!-- shows our mic on/off switch -->
    <img id = "mic_setting"  class="settingsImage" type="image" on:click={()=>{console.log('hey man')}} src="/assets/cam_settings/mic_off.svg" alt="hello" class:isMicOn = {$isMicPermissionGranted}/>
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
