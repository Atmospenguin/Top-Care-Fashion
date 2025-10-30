import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import LikesTab from './LikesTab';
import SavedOutfitsTab from './SavedOutfitsTab';

const TopTabs = createMaterialTopTabNavigator();

export default function LikesTabs() {
  return (
    <TopTabs.Navigator
      initialRouteName="Likes"
      screenOptions={{
        tabBarIndicatorStyle: {
          backgroundColor: '#000',
        },
        tabBarLabelStyle: { fontWeight: '600', textTransform: 'none' },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: { backgroundColor: '#fff' },
      }}
    >
      <TopTabs.Screen
        name="Likes"
        component={LikesTab}
      />
      <TopTabs.Screen
        name="SavedOutfits"
        component={SavedOutfitsTab}
        options={{ title: 'Saved Outfits' }}
      />
    </TopTabs.Navigator>
  );
}
