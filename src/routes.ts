import Home from './Home.svelte';
import Video from './VideoRoom/Video.svelte'
export  const routes = {
    '/' : Home,
    '/:id': Video,
}
    

