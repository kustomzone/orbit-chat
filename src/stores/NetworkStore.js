'use strict'

import { action, computed, configure, keys, observable, reaction, values } from 'mobx'

import ChannelStore from 'stores/ChannelStore'

import Logger from 'utils/logger'

configure({ enforceActions: 'observed' })

const logger = new Logger()

export default class NetworkStore {
  constructor (rootStore) {
    this.rootStore = rootStore
    this.startLoading = this.rootStore.uiStore.startLoading
    this.stopLoading = this.rootStore.uiStore.stopLoading

    this.onUsernameChanged = this.onUsernameChanged.bind(this)

    // React to ipfs changes
    reaction(() => this.rootStore.ipfsStore.node, this.onIpfsChanged)

    // React to orbit changes
    reaction(() => this.rootStore.orbitStore.node, this.onOrbitChanged)

    // React to user changes
    reaction(() => this.rootStore.sessionStore.username, this.onUsernameChanged)
  }

  @observable
  channels = {}

  @observable
  _ipfs = null

  @observable
  _orbit = null

  @observable
  swarmPeers = []

  _username = null

  @computed
  get ipfs () {
    return this._ipfs
  }

  @computed
  get orbit () {
    return this._orbit
  }

  @computed
  get isOnline () {
    return this._ipfs && this._orbit
  }

  get channelNames () {
    return keys(this.channels)
  }

  get channelsAsArray () {
    return values(this.channels)
  }

  @action.bound
  onIpfsChanged (newIpfs) {
    this._ipfs = newIpfs
  }

  @action.bound
  onOrbitChanged (newOrbit) {
    this.stopOrbit()

    this._orbit = newOrbit

    if (this.orbit) {
      this.orbit.events.on('joined', this.onJoinedChannel)
      this.orbit.events.on('left', this.onLeftChannel)
      this.orbit.events.on('peers', this.onSwarmPeerUpdate)
    }
  }

  @action.bound
  onJoinedChannel (channelName) {
    this.stopLoading('channel:join')
    if (this.channelNames.indexOf(channelName) !== -1) return
    const channelSetup = Object.assign({}, this.orbit.channels[channelName], { network: this })
    this.channels[channelName] = new ChannelStore(channelSetup)
  }

  @action.bound
  onLeftChannel (channelName) {
    this.stopLoading('channel:leave')
    this.removeChannel(channelName)
  }

  @action.bound
  onSwarmPeerUpdate (peers) {
    this.swarmPeers = peers
  }

  onUsernameChanged (newUsername) {
    if (newUsername !== this._username) this.stop()
    this._username = newUsername
  }

  async stop () {
    if (!this.isOnline) return
    logger.info('Stopping network')

    this.stopOrbit()

    await this.rootStore.orbitStore.stop()
    await this.rootStore.ipfsStore.stop()
  }

  @action.bound
  stopOrbit () {
    this.channelNames.map(this.removeChannel)

    this.swarmPeers = []

    if (this.orbit) {
      this.orbit.events.removeListener('joined', this.onJoinedChannel)
      this.orbit.events.removeListener('left', this.onLeftChannel)
      this.orbit.events.removeListener('peers', this.onSwarmPeerUpdate)
    }
  }

  joinChannel (channelName) {
    if (!this.orbit || this.channelNames.indexOf(channelName) !== -1) return
    this.startLoading('channel:join')
    this.orbit.join(channelName)
  }

  leaveChannel (channelName) {
    if (!this.orbit || this.channelNames.indexOf(channelName) === -1) return
    this.startLoading('channel:leave')
    this.orbit.leave(channelName)
  }

  @action.bound
  removeChannel (channelName) {
    this.channels[channelName].stop()
    delete this.channels[channelName]
  }
}
