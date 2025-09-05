import React, { useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { UserContext } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

function HomePage({ navigation }) {
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();
  
  const handleAccess = () => navigation.navigate('MainTabs');
  const handleLogin = () => navigation.navigate('Login');
  const handleRegister = () => navigation.navigate('Register');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.titleContainer}>
              <Icon name="medication" size={48} color="#007AFF" />
              <Text style={styles.title}>{t('app.title')}</Text>
            </View>
            <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
            
            <View style={styles.buttonContainer}>
              {userInfo ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleAccess}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>{t('app.access')}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleLogin}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryButtonText}>{t('app.login')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleRegister}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>{t('app.register')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Icon name="event-available" size={40} color="#007AFF" />
              <Text style={styles.featureTitle}>{t('features.title1')}</Text>
              <Text style={styles.featureDesc}>{t('features.desc1')}</Text>
            </View>
            <View style={styles.feature}>
              <Icon name="people" size={40} color="#007AFF" />
              <Text style={styles.featureTitle}>{t('features.title2')}</Text>
              <Text style={styles.featureDesc}>{t('features.desc2')}</Text>
            </View>
            <View style={styles.feature}>
              <Icon name="lock" size={40} color="#007AFF" />
              <Text style={styles.featureTitle}>{t('features.title3')}</Text>
              <Text style={styles.featureDesc}>{t('features.desc3')}</Text>
            </View>
          </View>

          <View style={styles.whySection}>
            <Text style={styles.sectionTitle}>{t('why.title')}</Text>
            <Text style={styles.sectionDesc}>{t('why.desc')}</Text>
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={styles.testimonialSection}>
          <Text style={styles.sectionTitle}>{t('testimonials.title')}</Text>
          <View style={styles.testimonial}>
            <Text style={styles.quote}>"{t('testimonials.quote')}"</Text>
            <Text style={styles.author}>— {t('testimonials.author')}</Text>
          </View>
        </View>

        {/* Mobile Section */}
        <View style={styles.section}>
          <View style={styles.mobileSection}>
            <Icon name="smartphone" size={80} color="#007AFF" />
            <View style={styles.mobileContent}>
              <Text style={styles.sectionTitle}>{t('mobile.title')}</Text>
              <Text style={styles.sectionDesc}>{t('mobile.desc')}</Text>
              
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#007AFF" />
                  <Text style={styles.featureItemText}>{t('mobile.feature1')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#007AFF" />
                  <Text style={styles.featureItemText}>{t('mobile.feature2')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#007AFF" />
                  <Text style={styles.featureItemText}>{t('mobile.feature3')}</Text>
                </View>
              </View>

              {Platform.OS === 'ios' && (
                <View style={styles.alert}>
                  <Text style={styles.alertText}>{t('mobile.ios')}</Text>
                </View>
              )}

              {Platform.OS === 'android' && (
                <View style={styles.alert}>
                  <Text style={styles.alertText}>{t('mobile.android')}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>{t('cta.title')}</Text>
          <Text style={styles.ctaDesc}>{t('cta.desc')}</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>{t('cta.button')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
            <Text style={styles.footerLink}>{t('privacy.label')}</Text>
          </TouchableOpacity>
          <Text style={styles.footerSeparator}>|</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.footerLink}>{t('terms.label')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: width - 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  feature: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  whySection: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionDesc: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width - 80,
  },
  testimonialSection: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  testimonial: {
    maxWidth: width - 80,
    alignItems: 'center',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  author: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  mobileSection: {
    alignItems: 'center',
  },
  mobileContent: {
    alignItems: 'center',
    marginTop: 24,
    maxWidth: width - 40,
  },
  featureList: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  featureItemText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
    flex: 1,
  },
  alert: {
    backgroundColor: '#d1ecf1',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  alertText: {
    fontSize: 14,
    color: '#0c5460',
    textAlign: 'center',
  },
  ctaSection: {
    backgroundColor: '#007AFF',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaDesc: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: '#6c757d',
    textDecorationLine: 'none',
  },
  footerSeparator: {
    fontSize: 12,
    color: '#6c757d',
    marginHorizontal: 12,
  },
});

export default HomePage;
