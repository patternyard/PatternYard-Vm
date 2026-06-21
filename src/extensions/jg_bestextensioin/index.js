const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');

/**
 * Class for blocks
 * @constructor
 */
class JgBestExtensionBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * @type {HTMLVideoElement}
         */
        this.videoElement = null;

        this.runtime.on('PROJECT_STOP_ALL', () => {
            if (!this.videoElement) return;
            this.videoElement.remove();
            this.videoElement = null;
        });
        this.runtime.on('RUNTIME_PAUSED', () => {
            if (!this.videoElement) return;
            this.videoElement.pause();
        });
        this.runtime.on('RUNTIME_UNPAUSED', () => {
            if (!this.videoElement) return;
            this.videoElement.play();
        });
        this.runtime.on('BEFORE_EXECUTE', () => {
            this.setVolumeProperly();
        });
    }

    setVolumeProperly() {
        if (!this.videoElement) return;
        try {
            this.videoElement.volume = this.runtime.audioEngine.inputNode.gain.value * 0.5;
        } catch {
            // well that sucks
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: 'jgBestExtension',
            name: 'the great',
            color1: '#ff0000',
            color2: '#00ff00',
            color3: '#0000ff',
            blocks: [
                {
                    opcode: 'ohioBlock',
                    text: 'absolutely delectable!',
                    blockType: BlockType.COMMAND,
                    disableMonitor: false
                }
            ]
        };
    }

    ohioBlock() {
        if (this.videoElement) return;

        const canvas = this.runtime.renderer.canvas;
        if (!canvas) return;
        if (!canvas.parentElement) return;

        const video = document.createElement("video");
        video.style = 'width: 100%; height: 100%; z-index: 10000; position: absolute; left: 0; top: 0;';
        video.innerHTML = '<source src="https://patternyard.dev/bx-tv1.mp4" type="video/mp4">'
            + '<source src="https://patternyard.dev/vr/themes/selection.mp3" type="audio/mpeg">';
        this.videoElement = video;
        canvas.parentElement.appendChild(video);

        this.setVolumeProperly();
        video.play();

        video.onended = () => {
            video.remove();
            this.videoElement = null;
        };
    }
}

module.exports = JgBestExtensionBlocks;
