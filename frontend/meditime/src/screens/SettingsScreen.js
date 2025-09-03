import React, { useState } from 'react';
import {
  Box,
  ScrollView,
  VStack,
  HStack,
  Text,
  Switch,
  Pressable,
  Icon,
  Heading,
  Button,
  Card,
  Alert,
  Divider,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  const handleLogout = () => {
    setShowAlert(true);
  };

  const SettingsItem = ({ icon, title, subtitle, onPress, rightElement, iconColor = "primary.500" }) => (
    <Pressable onPress={onPress}>
      <HStack space="3" alignItems="center" py="3">
        <Box bg={`${iconColor.split('.')[0]}.100`} p="2" rounded="lg">
          <Icon as={Ionicons} name={icon} size="sm" color={iconColor} />
        </Box>
        <VStack flex="1">
          <Text fontWeight="medium">{title}</Text>
          {subtitle && (
            <Text fontSize="sm" color="coolGray.600">
              {subtitle}
            </Text>
          )}
        </VStack>
        {rightElement || <Icon as={Ionicons} name="chevron-forward" size="sm" color="coolGray.400" />}
      </HStack>
    </Pressable>
  );

  return (
    <ScrollView bg="coolGray.50" flex={1}>
      {/* Header */}
      <Box px="4" pt="6" pb="4">
        <Heading size="xl">Paramètres</Heading>
      </Box>

      {/* Section Profil */}
      <Box mx="4" mb="4">
        <Card>
          <VStack space="0">
            <Box px="4" pt="4" pb="2">
              <Text fontSize="sm" color="coolGray.600" textTransform="uppercase">
                PROFIL
              </Text>
            </Box>
            
            <Box px="4">
              <SettingsItem
                icon="person-circle"
                title="Profil"
                subtitle="Modifier vos informations"
                onPress={() => console.log('Edit profile')}
              />
              <Divider />
              <SettingsItem
                icon="medical"
                title="Médecin traitant"
                subtitle="Dr. Martin"
                onPress={() => console.log('Edit doctor')}
                iconColor="emerald.500"
              />
            </Box>
          </VStack>
        </Card>
      </Box>

      {/* Section Notifications */}
      <Box mx="4" mb="4">
        <Card>
          <VStack space="0">
            <Box px="4" pt="4" pb="2">
              <Text fontSize="sm" color="coolGray.600" textTransform="uppercase">
                NOTIFICATIONS
              </Text>
            </Box>
            
            <Box px="4">
              <HStack space="3" alignItems="center" py="3">
                <Box bg="orange.100" p="2" rounded="lg">
                  <Icon as={Ionicons} name="notifications" size="sm" color="orange.500" />
                </Box>
                <VStack flex="1">
                  <Text fontWeight="medium">Notifications push</Text>
                </VStack>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  colorScheme="primary"
                />
              </HStack>

              <Divider />

              <HStack space="3" alignItems="center" py="3">
                <Box bg="cyan.100" p="2" rounded="lg">
                  <Icon as={Ionicons} name="mail" size="sm" color="cyan.500" />
                </Box>
                <VStack flex="1">
                  <Text fontWeight="medium">Notifications email</Text>
                </VStack>
                <Switch
                  value={emailEnabled}
                  onValueChange={setEmailEnabled}
                  colorScheme="primary"
                />
              </HStack>

              <Divider />

              <HStack space="3" alignItems="center" py="3">
                <Box bg="violet.100" p="2" rounded="lg">
                  <Icon as={Ionicons} name="volume-high" size="sm" color="violet.500" />
                </Box>
                <VStack flex="1">
                  <Text fontWeight="medium">Son</Text>
                </VStack>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  isDisabled={!notificationsEnabled}
                  colorScheme="primary"
                />
              </HStack>
            </Box>
          </VStack>
        </Card>
      </Box>

      {/* Section Application */}
      <Box mx="4" mb="4">
        <Card>
          <VStack space="0">
            <Box px="4" pt="4" pb="2">
              <Text fontSize="sm" color="coolGray.600" textTransform="uppercase">
                APPLICATION
              </Text>
            </Box>
            
            <Box px="4">
              <SettingsItem
                icon="language"
                title="Langue"
                subtitle="Français"
                onPress={() => console.log('Change language')}
                iconColor="blue.500"
              />
              <Divider />
              <SettingsItem
                icon="color-palette"
                title="Thème"
                subtitle="Automatique"
                onPress={() => console.log('Change theme')}
                iconColor="purple.500"
              />
              <Divider />
              <SettingsItem
                icon="cloud"
                title="Sauvegarde"
                subtitle="iCloud activé"
                onPress={() => console.log('Backup settings')}
                iconColor="sky.500"
              />
            </Box>
          </VStack>
        </Card>
      </Box>

      {/* Section Aide */}
      <Box mx="4" mb="4">
        <Card>
          <VStack space="0">
            <Box px="4" pt="4" pb="2">
              <Text fontSize="sm" color="coolGray.600" textTransform="uppercase">
                AIDE
              </Text>
            </Box>
            
            <Box px="4">
              <SettingsItem
                icon="help-circle"
                title="Centre d'aide"
                onPress={() => console.log('Help center')}
                iconColor="yellow.500"
              />
              <Divider />
              <SettingsItem
                icon="mail"
                title="Nous contacter"
                onPress={() => console.log('Contact us')}
                iconColor="green.500"
              />
              <Divider />
              <SettingsItem
                icon="document-text"
                title="Conditions d'utilisation"
                onPress={() => console.log('Terms')}
                iconColor="gray.500"
              />
            </Box>
          </VStack>
        </Card>
      </Box>

      {/* Bouton Déconnexion */}
      <Box mx="4" mb="4">
        <Button colorScheme="danger" onPress={handleLogout}>
          Se déconnecter
        </Button>
      </Box>

      {/* Footer */}
      <Box alignItems="center" pb="8">
        <Text fontSize="sm" color="coolGray.500">
          Version 1.0.0
        </Text>
      </Box>

      {/* Alert pour la déconnexion */}
      {showAlert && (
        <Alert w="100%" status="warning">
          <VStack space={2} flexShrink={1} w="100%">
            <HStack flexShrink={1} space={2} alignItems="center">
              <Alert.Icon />
              <Text fontSize="md" fontWeight="medium">
                Déconnexion
              </Text>
            </HStack>
            <Box pl="6">
              <Text>Êtes-vous sûr de vouloir vous déconnecter ?</Text>
            </Box>
            <HStack space={2} pl="6">
              <Button size="sm" onPress={() => setShowAlert(false)}>
                Annuler
              </Button>
              <Button size="sm" colorScheme="danger" onPress={() => setShowAlert(false)}>
                Déconnexion
              </Button>
            </HStack>
          </VStack>
        </Alert>
      )}
    </ScrollView>
  );
}
