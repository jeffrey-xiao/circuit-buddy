<template>
    <div id="tabs-bar">
        <div id="tabs">
            <tab v-for="tab in tabs" v-bind:tab-id="tab.id" v-bind:name="tab.name" v-bind:curr-active="activeTab"></tab>
        </div><add-tab></add-tab>
    </div>
</template>

<script>
	module.exports = {
		props: ['tabs', 'activeTab']
	};
</script>