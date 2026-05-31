import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  SafeAreaView, StatusBar, Modal, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const API_URL = 'http://10.0.2.2:4001/api';

// ─── AUTH CONTEXT ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ─── COLORS - ELEGANT THEATER THEME ────────────────────────────────────────────
const C = {
  bg: '#0F0F13',
  surface: '#18181D',
  card: 'rgba(28, 28, 35, 0.95)',
  accent: '#C7A13B',
  accentDim: '#8B6B2E',
  accentLight: '#DDBD6A',
  red: '#E85D5D',
  green: '#5DBB6D',
  reserved: '#2A2520',
  text: '#F5F5F0',
  textMuted: '#9CA3AF',
  border: '#2A2A32',
  screen: '#D4C5A0',
  gold: '#C7A13B',
  goldLight: '#E8D5A3',
};

const { width } = Dimensions.get('window');




// ─── ANIMATED COMPONENTS ───────────────────────────────────────────────────────
const AnimatedCard = ({ children, delay = 0, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {children}
    </Animated.View>
  );
};

const GlowingButton = ({ onPress, title, loading, icon, variant = 'primary' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const gradientColors = variant === 'primary' 
    ? [C.accent, C.accentDim] 
    : ['#2A2A35', '#1A1A24'];

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={variant === 'primary' ? s.glowButton : s.secondaryButton}
        >
          {loading ? (
            <ActivityIndicator color={variant === 'primary' ? '#0F0F13' : C.gold} />
          ) : (
            <>
              {icon && <Text style={s.buttonIcon}>{icon}</Text>}
              <Text style={variant === 'primary' ? s.glowButtonText : s.secondaryButtonText}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── LOGIN SCREEN ──────────────────────────────────────────────────────────────
const LoginScreen = ({ onSwitch }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@theater.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Fill all fields');
    setLoading(true);
    try {
      const data = await api('/auth/login', 'POST', { email, password });
      login(data.token, data.refresh_token, data.user);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F0F13', '#18181D', '#0F0F13']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <ScrollView contentContainerStyle={s.authContainer}>
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            <Text style={s.logo}>📢</Text>
            <Text style={s.title}>THEATER MAYHEM</Text>
            <LinearGradient colors={[C.gold, C.goldLight]} style={s.titleUnderline} />
            <Text style={s.subtitle}>Premium Theater Booking</Text>
          </Animated.View>

          <AnimatedCard delay={200} style={s.card}>
            <Text style={s.label}>EMAIL</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@theater.com"
              placeholderTextColor={C.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={s.label}>PASSWORD</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={C.textMuted}
              secureTextEntry
            />
            <GlowingButton onPress={handleLogin} title="SIGN IN" loading={loading} icon="→" />
          </AnimatedCard>

          <TouchableOpacity onPress={onSwitch}>
            <Text style={s.switchText}>No account? <Text style={s.accentText}>Create Account</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── REGISTER SCREEN ───────────────────────────────────────────────────────────
const RegisterScreen = ({ onSwitch }) => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Fill all fields');
    setLoading(true);
    try {
      const data = await api('/auth/register', 'POST', { name, email, password });
      login(data.token, data.user);
    } catch (e) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F0F13', '#18181D', '#0F0F13']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <ScrollView contentContainerStyle={s.authContainer}>
          <Text style={s.logo}>📢</Text>
          <Text style={s.title}>THEATER MAYHEM</Text>
          <LinearGradient colors={[C.gold, C.goldLight]} style={s.titleUnderline} />
          <Text style={s.subtitle}>Join the Experience</Text>

          <AnimatedCard style={s.card}>
            <Text style={s.label}>FULL NAME</Text>
            <TextInput style={s.input} value={name} onChangeText={setName}
              placeholder="John Doe" placeholderTextColor={C.textMuted} />
            <Text style={s.label}>EMAIL</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail}
              placeholder="you@example.com" placeholderTextColor={C.textMuted}
              keyboardType="email-address" autoCapitalize="none" />
            <Text style={s.label}>PASSWORD</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword}
              placeholder="Min 6 characters" placeholderTextColor={C.textMuted} secureTextEntry />
            <GlowingButton onPress={handleRegister} title="CREATE ACCOUNT" loading={loading} />
          </AnimatedCard>

          <TouchableOpacity onPress={onSwitch}>
            <Text style={s.switchText}>Have an account? <Text style={s.accentText}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── THEATRE DETAILS SCREEN ─────────────────────────────────────────────────────
const TheatreDetailsScreen = ({ theatre, onBack }) => {
  const { token } = useAuth();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheatreShows();
  }, []);

  const fetchTheatreShows = async () => {
    try {
      const allShows = await api('/shows', 'GET', null, token);
      const theatreShows = allShows.filter(s => s.theatre_id === theatre.theatre_id);
      setShows(theatreShows);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const facilitiesList = theatre.facilities ? theatre.facilities.split(',').map(f => f.trim()) : [];

  return (
    <LinearGradient colors={['#0F0F13', '#14141A']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={s.backBtnLight}>← BACK</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>Theatre</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={{ flex: 1 }}>
          <View style={s.theatreHero}>
            <Text style={s.theatreHeroEmoji}>🏛️</Text>
            <Text style={s.theatreHeroName}>{theatre.name}</Text>
            <Text style={s.theatreHeroLocation}>📍 {theatre.location}</Text>
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.theatreDescription}>{theatre.description}</Text>
            
            {theatre.address && (
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Address:</Text>
                <Text style={s.infoValue}>{theatre.address}</Text>
              </View>
            )}
          </View>

          {facilitiesList.length > 0 && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>Facilities & Amenities</Text>
              <View style={s.facilitiesGrid}>
                {facilitiesList.map((facility, index) => (
                  <View key={index} style={s.facilityBadge}>
                    <Text style={s.facilityBadgeText}>✓ {facility}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={s.card}>
            <Text style={s.sectionTitle}>Upcoming Shows</Text>
            {loading ? (
              <ActivityIndicator color={C.gold} />
            ) : shows.length > 0 ? (
              shows.map(show => (
                <View key={show.id} style={s.upcomingShowItem}>
                  <Text style={s.upcomingShowTitle}>{show.title}</Text>
                  <Text style={s.upcomingShowDate}>
                    📅 {new Date(show.show_date).toLocaleDateString()} at {show.show_time}
                  </Text>
                  <Text style={s.upcomingShowPrice}>€{parseFloat(show.price).toFixed(2)}</Text>
                </View>
              ))
            ) : (
              <Text style={s.empty}>No upcoming shows</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── SHOW DETAILS SCREEN ───────────────────────────────────────────────────────
const ShowDetailsScreen = ({ show, onBack, onBook, onTheatrePress }) => {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await api(`/shows/${show.id}/reviews`, 'GET', null, token);
      setReviews(data || []);
    } catch (e) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (userRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    try {
      await api('/reviews', 'POST', {
        show_id: show.id,
        rating: userRating,
        comment: userComment
      }, token);
      Alert.alert('Success', 'Thank you for your review!');
      setUserRating(0);
      setUserComment('');
      fetchReviews();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <LinearGradient colors={['#0F0F13', '#14141A']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={s.backBtnLight}>← BACK</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>Show Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={{ flex: 1 }}>
          <View style={s.showHero}>
            <Text style={s.showHeroEmoji}>
              {show.genre === 'Drama' ? '🎭' : show.genre === 'Musical' ? '🎵' : show.genre === 'Comedy' ? '😂' : '🎬'}
            </Text>
            <Text style={s.showHeroTitle}>{show.title}</Text>
            <View style={s.showHeroMeta}>
              <Text style={s.showHeroGenre}>{show.genre}</Text>
              <Text style={s.showHeroRating}>⭐ {avgRating} ({reviews.length} reviews)</Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.showDescription}>{show.description || 'No description available.'}</Text>
            
            <View style={s.detailsGrid}>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Duration</Text>
                <Text style={s.detailValue}>{show.duration || 120} min</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Age Rating</Text>
                <Text style={s.detailValue}>{show.age_rating || 'ALL'}</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Price</Text>
                <Text style={s.detailValue}>€{parseFloat(show.price).toFixed(2)}</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Available</Text>
                <Text style={s.detailValue}>{show.available_seats} seats</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={s.card} 
            onPress={onTheatrePress}>
            <Text style={s.sectionTitle}>Venue</Text>
            <Text style={s.venueName}>📍 {show.theatre_name || show.venue}</Text>
            <Text style={s.venueLocation}>{show.location}</Text>
            <Text style={s.venueLink}>Tap for venue details →</Text>
          </TouchableOpacity>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Rate This Show</Text>
            <View style={s.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                  <Text style={[s.star, userRating >= star && s.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.reviewInput}
              placeholder="Write your review..."
              placeholderTextColor={C.textMuted}
              value={userComment}
              onChangeText={setUserComment}
              multiline
            />
            <GlowingButton onPress={submitReview} title="SUBMIT REVIEW" />
          </View>

          {reviews.length > 0 && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>Audience Reviews</Text>
              {reviews.map((review, index) => (
                <View key={index} style={s.reviewItem}>
                  <View style={s.reviewHeader}>
                    <Text style={s.reviewUser}>{review.user_name || 'Anonymous'}</Text>
                    <View style={s.reviewStars}>
                      {[...Array(review.rating)].map((_, i) => (
                        <Text key={i} style={s.smallStar}>★</Text>
                      ))}
                    </View>
                  </View>
                  <Text style={s.reviewComment}>{review.comment}</Text>
                  <Text style={s.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          )}

          <GlowingButton onPress={onBook} title="SELECT SEATS" />
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── SEAT MAP SCREEN ───────────────────────────────────────────────────────────
const SeatMapScreen = ({ show, onBack }) => {
  const { token } = useAuth();
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [showtimeId, setShowtimeId] = useState(null);

  useEffect(() => {
    fetchShowAndSeats();
  }, []);

  const fetchShowAndSeats = async () => {
    try {
      const showsResponse = await api('/shows', 'GET', null, token);
      const currentShow = showsResponse.find(s => s.id === show.id);
      if (currentShow?.showtime_id) setShowtimeId(currentShow.showtime_id);
      const seatsData = await api(`/shows/${show.id}/seats`, 'GET', null, token);
      setSeats(seatsData);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seat) => {
    if (seat.status === 'booked') return;
    setSelected(prev =>
      prev.find(s => s.id === seat.id)
        ? prev.filter(s => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  const handleBook = async () => {
    if (!selected.length) {
      Alert.alert('Select seats', 'Please select at least one seat');
      return;
    }
    if (!showtimeId) {
      Alert.alert('Error', 'Showtime information missing. Please try again.');
      return;
    }
    
    setBooking(true);
    setConfirmVisible(false);
    try {
      const bookingData = {
        show_id: show.id,
        showtime_id: showtimeId,
        seat_ids: selected.map(s => s.id)
      };
      
      await api('/bookings', 'POST', bookingData, token);
      Alert.alert('Booked!', `${selected.length} seat(s) confirmed for ${show.title}`, [
        { text: 'OK', onPress: onBack }
      ]);
    } catch (e) {
      Alert.alert('Booking Failed', e.message);
    } finally {
      setBooking(false);
    }
  };

  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) acc[seat.row_label] = [];
    acc[seat.row_label].push(seat);
    return acc;
  }, {});

  const getSeatColors = (seat) => {
    if (seat.status === 'booked') return ['#2A2520', '#1F1B18'];
    if (selected.find(s => s.id === seat.id)) return [C.gold, C.accentDim];
    if (seat.category === 'vip') return ['#C7A13B', '#8B6B2E'];
    if (seat.category === 'premium') return ['#6B7280', '#4B5563'];
    return ['#2A2A35', '#1A1A24'];
  };

  const total = selected.reduce((sum, s) => sum + (parseFloat(show.price) * parseFloat(s.price_multiplier || 1)), 0);

  return (
    <LinearGradient colors={['#0F0F13', '#14141A']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={s.backBtnLight}>← BACK</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{show.title}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={{ flex: 1 }}>
          <View style={s.screenContainer}>
            <LinearGradient colors={[C.goldLight, C.gold]} style={s.screenBar} />
            <Text style={s.screenLabel}>STAGE</Text>
          </View>

          <View style={s.legend}>
            {[
              { colors: ['#2A2A35', '#1A1A24'], label: 'Standard' },
              { colors: ['#6B7280', '#4B5563'], label: 'Premium' },
              { colors: ['#C7A13B', '#8B6B2E'], label: 'VIP' },
              { colors: [C.gold, C.accentDim], label: 'Selected' },
              { colors: ['#2A2520', '#1F1B18'], label: 'Booked' },
            ].map(item => (
              <View key={item.label} style={s.legendItem}>
                <LinearGradient colors={item.colors} style={s.legendDot} />
                <Text style={s.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={C.gold} style={{ marginTop: 40 }} size="large" />
          ) : (
            Object.entries(rows).sort().map(([row, rowSeats]) => (
              <View key={row} style={s.seatRow}>
                <Text style={s.rowLabel}>{row}</Text>
                {rowSeats.sort((a, b) => a.seat_number - b.seat_number).map(seat => (
                  <TouchableOpacity
                    key={seat.id}
                    onPress={() => toggleSeat(seat)}
                    disabled={seat.status === 'booked'}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={getSeatColors(seat)}
                      style={[s.seat, seat.status === 'booked' && s.seatBooked]}
                    >
                      <Text style={s.seatNum}>{seat.seat_number}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
                <Text style={s.rowLabel}>{row}</Text>
              </View>
            ))
          )}
          <View style={{ height: 120 }} />
        </ScrollView>

        {selected.length > 0 && (
          <Animated.View style={s.bookingBar}>
            <View>
              <Text style={s.bookingSeats}>{selected.length} seat{selected.length > 1 ? 's' : ''} selected</Text>
              <Text style={s.bookingTotal}>€{total.toFixed(2)}</Text>
            </View>
            <GlowingButton onPress={() => setConfirmVisible(true)} title="CONFIRM" disabled={booking} />
          </Animated.View>
        )}

        <Modal visible={confirmVisible} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <LinearGradient colors={['#1C1C28', '#0F0F13']} style={s.modal}>
              <Text style={s.modalTitle}>Confirm Booking</Text>
              <Text style={s.modalShow}>{show.title}</Text>
              <Text style={s.modalTotal}>€{total.toFixed(2)}</Text>
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.modalCancel} onPress={() => setConfirmVisible(false)}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <GlowingButton onPress={handleBook} title="Book Now" />
              </View>
            </LinearGradient>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── SHOWS LIST SCREEN ─────────────────────────────────────────────────────────
const ShowsScreen = ({ onSelectShow, onSelectTheatre }) => {
  const { token, user, logout } = useAuth();
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showTheatres, setShowTheatres] = useState(false);
  const [activeTab, setActiveTab] = useState('shows');

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    try {
      const query = search ? `/shows?q=${encodeURIComponent(search)}` : '/shows';
      const showsData = await api(query, 'GET', null, token);
      const theatresData = await api('/theatres', 'GET', null, token);
      setShows(showsData);
      setTheatres(theatresData);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderShow = ({ item, index }) => (
    <AnimatedCard delay={index * 80}>
      <TouchableOpacity style={s.showCard} onPress={() => onSelectShow(item)}>
        <LinearGradient colors={['rgba(199,161,59,0.08)', 'transparent']} style={s.showCardGradient}>
          <View style={s.showHeader}>
            <Text style={s.showEmoji}>
              {item.genre === 'Drama' ? '🎭' : item.genre === 'Musical' ? '🎵' : item.genre === 'Comedy' ? '😂' : '🎬'}
            </Text>
            <View style={s.showBadge}>
              <Text style={s.showBadgeText}>{item.genre}</Text>
            </View>
          </View>
          <Text style={s.showTitle}>{item.title}</Text>
          <Text style={s.showMeta}>📍 {item.theatre_name || item.venue}</Text>
          <Text style={s.showMeta}>📅 {new Date(item.show_date).toLocaleDateString()}</Text>
          <Text style={s.showMeta}>🕐 {item.show_time}</Text>
          <Text style={s.showMeta}>⏱️ {item.duration || 120} min | {item.age_rating || 'ALL'}</Text>
          <View style={s.showFooter}>
            <Text style={s.showPrice}>€{parseFloat(item.price).toFixed(2)}</Text>
            <View style={s.seatsBadge}>
              <Text style={s.showSeats}>{item.available_seats} left</Text>
            </View>
          </View>
          <View style={s.showActionButtons}>
            <TouchableOpacity 
              style={s.detailsBtn} 
              onPress={(e) => {
                e.stopPropagation();
                onSelectShow(item);
              }}>
              <Text style={s.detailsBtnText}>📖 Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={s.theatreBtn}
              onPress={(e) => {
                e.stopPropagation();
                const theatre = theatres.find(t => t.name === item.theatre_name);
                if (theatre) onSelectTheatre(theatre);
              }}>
              <Text style={s.theatreBtnText}>🏛️ Venue</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </AnimatedCard>
  );

  const renderTheatre = ({ item, index }) => (
    <AnimatedCard delay={index * 80}>
      <TouchableOpacity style={s.theatreCard} onPress={() => onSelectTheatre(item)}>
        <LinearGradient colors={['rgba(199,161,59,0.08)', 'transparent']} style={s.theatreCardGradient}>
          <Text style={s.theatreCardEmoji}>🏛️</Text>
          <Text style={s.theatreCardName}>{item.name}</Text>
          <Text style={s.theatreCardLocation}>📍 {item.location}</Text>
          <Text style={s.theatreCardShows}>{item.show_count} shows available</Text>
          <View style={s.theatreFacilities}>
            {item.facilities?.split(',').slice(0, 2).map((fac, i) => (
              <Text key={i} style={s.theatreFacilityBadge}>✓ {fac.trim()}</Text>
            ))}
            {item.facilities?.split(',').length > 2 && (
              <Text style={s.theatreMore}>+{item.facilities.split(',').length - 2} more</Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </AnimatedCard>
  );

  return (
    <LinearGradient colors={['#0F0F13', '#14141A']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.logoSmall}>📢</Text>
          </View>
          <View style={s.headerTitleContainer}>
            <Text style={s.headerTitle}>THEATER MAYHEM</Text>
            <Text style={s.headerSub}>Welcome, {user?.name}</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.logoutBtn} onPress={logout}>
              <Text style={s.logoutText}>EXIT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.searchContainer}>
          <TextInput
            style={s.searchInput}
            placeholder="🔍 Search shows, theatre, location..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={s.toggleContainer}>
          <TouchableOpacity 
            style={[s.toggleBtn, !showTheatres && s.toggleBtnActive]} 
            onPress={() => setShowTheatres(false)}>
            <Text style={[s.toggleBtnText, !showTheatres && s.toggleBtnTextActive]}>🎭 Shows</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.toggleBtn, showTheatres && s.toggleBtnActive]} 
            onPress={() => setShowTheatres(true)}>
            <Text style={[s.toggleBtnText, showTheatres && s.toggleBtnTextActive]}>🏛️ Theatres</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={C.gold} size="large" />
        ) : showTheatres ? (
          <FlatList
            data={theatres}
            keyExtractor={i => i.theatre_id.toString()}
            renderItem={renderTheatre}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={s.empty}>No theatres found</Text>}
          />
        ) : (
          <FlatList
            data={shows}
            keyExtractor={i => i.id.toString()}
            renderItem={renderShow}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={s.empty}>No shows available</Text>}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── MY BOOKINGS SCREEN ────────────────────────────────────────────────────────
const BookingsScreen = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await api('/bookings/my', 'GET', null, token);
      setBookings(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    Alert.alert('Cancel Booking', 'Are you sure?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          await api(`/bookings/${id}`, 'DELETE', null, token);
          fetchBookings();
          Alert.alert('Success', 'Booking cancelled');
        } catch (e) {
          Alert.alert('Error', e.message);
        }
      }}
    ]);
  };

  const renderBooking = ({ item, index }) => (
    <AnimatedCard delay={index * 80}>
      <View style={s.bookingCard}>
        <LinearGradient colors={['rgba(199,161,59,0.08)', 'transparent']} style={s.bookingCardGradient}>
          <View style={s.bookingCardHeader}>
            <Text style={s.bookingCardTitle}>{item.show_title}</Text>
            <View style={[s.statusBadge, { backgroundColor: item.status === 'confirmed' ? 'rgba(93,187,109,0.15)' : 'rgba(232,93,93,0.15)' }]}>
              <Text style={[s.statusText, { color: item.status === 'confirmed' ? C.green : C.red }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={s.bookingInfo}>📍 {item.theatre_name || item.venue}</Text>
          <Text style={s.bookingInfo}>📅 {new Date(item.show_date).toLocaleDateString()}</Text>
          <Text style={s.bookingInfo}>🕐 {item.show_time}</Text>
          <Text style={s.bookingInfo}>💺 {item.seats}</Text>
          <Text style={s.bookingInfo}>💰 €{parseFloat(item.total_price).toFixed(2)}</Text>
          {item.status === 'confirmed' && (
            <TouchableOpacity style={s.cancelBtn} onPress={() => cancelBooking(item.id)}>
              <Text style={s.cancelBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    </AnimatedCard>
  );

  return (
    <LinearGradient colors={['#0F0F13', '#14141A']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.logoSmall}>📢</Text>
          </View>
          <View style={s.headerTitleContainer}>
            <Text style={s.headerTitle}>MY BOOKINGS</Text>
          </View>
          <View style={s.headerRight} />
        </View>
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color={C.gold} size="large" />
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={i => i.id.toString()}
            renderItem={renderBooking}
            contentContainerStyle={s.list}
            ListEmptyComponent={<Text style={s.empty}>No bookings yet</Text>}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authScreen, setAuthScreen] = useState('login');
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [showSeatMap, setShowSeatMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('discover');

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("token");
      if (storedToken) setToken(storedToken);
    } catch (error) {
      console.error('Failed to load token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (t, rt, u) => {
    await SecureStore.setItemAsync("token", t);
    await SecureStore.setItemAsync("refresh_token", rt);
    setToken(t);
    setUser(u);
  };
  const logout = async () => {
    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    if (refreshToken) {
      try {
        await api('/auth/logout', 'POST', { refresh_token: refreshToken }, token);
      } catch (e) {
        console.log('Logout error:', e.message);
      }
    }
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    setToken(null);
    setUser(null);
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#0F0F13', '#18181D']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.gold} />
      </LinearGradient>
    );
  }

  if (!token) {
    return (
      <AuthContext.Provider value={{ login }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F13" />
        {authScreen === 'login'
          ? <LoginScreen onSwitch={() => setAuthScreen('register')} />
          : <RegisterScreen onSwitch={() => setAuthScreen('login')} />
        }
      </AuthContext.Provider>
    );
  }

  // Handle seat map view
  if (showSeatMap) {
    return (
      <AuthContext.Provider value={{ token, user, logout }}>
        <SeatMapScreen show={showSeatMap} onBack={() => setShowSeatMap(null)} />
      </AuthContext.Provider>
    );
  }

  // Handle show details view
  if (selectedShow) {
    return (
      <AuthContext.Provider value={{ token, user, logout }}>
        <ShowDetailsScreen 
          show={selectedShow} 
          onBack={() => setSelectedShow(null)}
          onBook={() => {
            setShowSeatMap(selectedShow);
            setSelectedShow(null);
          }}
          onTheatrePress={() => {
            // Find theatre by name and show it
            const theatre = { theatre_id: selectedShow.theatre_id, name: selectedShow.theatre_name, location: selectedShow.location };
            setSelectedTheatre(theatre);
            setSelectedShow(null);
          }}
        />
      </AuthContext.Provider>
    );
  }

  // Handle theatre details view
  if (selectedTheatre) {
    return (
      <AuthContext.Provider value={{ token, user, logout }}>
        <TheatreDetailsScreen 
          theatre={selectedTheatre} 
          onBack={() => setSelectedTheatre(null)}
        />
      </AuthContext.Provider>
    );
  }

  // Main tab view
  return (
    <AuthContext.Provider value={{ token, user, logout }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F13" />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {tab === 'discover' ? (
          <ShowsScreen 
            onSelectShow={setSelectedShow}
            onSelectTheatre={setSelectedTheatre}
          />
        ) : (
          <BookingsScreen />
        )}
        <View style={s.tabBar}>
          <TouchableOpacity style={s.tab} onPress={() => setTab('discover')}>
            <Text style={[s.tabIcon, tab === 'discover' && s.tabActive]}>📢</Text>
            <Text style={[s.tabLabel, tab === 'discover' && s.tabActive]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tab} onPress={() => setTab('bookings')}>
            <Text style={[s.tabIcon, tab === 'bookings' && s.tabActive]}>🎟️</Text>
            <Text style={[s.tabLabel, tab === 'bookings' && s.tabActive]}>My Tickets</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthContext.Provider>
  );
}


let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const api = async (path, method = 'GET', body = null, token = null, retry = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  
  try {
    const res = await fetch(`${API_URL}${path}`, opts);
    const data = await res.json();
    
    // Handle token expiration
    if (res.status === 401 && data.code === 'TOKEN_EXPIRED' && retry) {
      // Try to refresh token
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            });
            const refreshData = await refreshRes.json();
            
            if (refreshRes.ok) {
              await SecureStore.setItemAsync("token", refreshData.token);
              onTokenRefreshed(refreshData.token);
              // Retry original request with new token
              return api(path, method, body, refreshData.token, false);
            } else {
              // Refresh failed, force logout
              await SecureStore.deleteItemAsync("token");
              await SecureStore.deleteItemAsync("refresh_token");
              throw new Error('Session expired. Please login again.');
            }
          } finally {
            isRefreshing = false;
          }
        } else {
          // Wait for token refresh to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh(async (newToken) => {
              const result = await api(path, method, body, newToken, false);
              resolve(result);
            });
          });
        }
      }
      throw new Error('No refresh token available');
    }
    
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (error) {
    throw error;
  }
};

// ─── COMPLETE STYLES ───────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1 },
  authContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingVertical: 60 },
  logo: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: 4, marginBottom: 8 },
  titleUnderline: { width: 50, height: 2, borderRadius: 1, marginTop: 8, marginBottom: 16 },
  subtitle: { fontSize: 13, color: C.textMuted, letterSpacing: 2, fontWeight: '500' },
  card: { width: '100%', backgroundColor: C.card, borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  label: { fontSize: 11, color: C.gold, letterSpacing: 2, marginBottom: 8, marginTop: 16, fontWeight: '700' },
  input: { backgroundColor: C.surface, color: C.text, borderRadius: 14, padding: 16, fontSize: 15, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  glowButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, marginTop: 24 },
  glowButtonText: { color: '#0F0F13', fontWeight: '800', fontSize: 15, letterSpacing: 2, marginLeft: 8 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, marginTop: 24, borderWidth: 1, borderColor: C.border },
  secondaryButtonText: { color: C.gold, fontWeight: '800', fontSize: 15, letterSpacing: 2, marginLeft: 8 },
  buttonIcon: { fontSize: 18, color: '#0F0F13' },
  switchText: { color: C.textMuted, marginTop: 20, fontSize: 13 },
  accentText: { color: C.gold, fontWeight: '700' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  headerLeft: { flex: 1 },
  headerTitleContainer: { flex: 2, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.gold, letterSpacing: 2 },
  headerSub: { fontSize: 11, color: C.textMuted, marginTop: 3 },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  logoSmall: { fontSize: 28 },
  logoutBtn: { backgroundColor: 'rgba(199,161,59,0.12)', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(199,161,59,0.3)' },
  logoutText: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  backBtnLight: { color: C.gold, fontSize: 14, fontWeight: '600' },
  
  searchContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  searchInput: { backgroundColor: C.surface, color: C.text, borderRadius: 14, padding: 14, fontSize: 14, borderWidth: 1, borderColor: C.border },
  
  toggleContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  toggleBtnActive: { backgroundColor: 'rgba(199,161,59,0.15)', borderColor: C.gold },
  toggleBtnText: { color: C.textMuted, fontWeight: '600' },
  toggleBtnTextActive: { color: C.gold },
  
  list: { padding: 16, paddingBottom: 100 },
  
  showCard: { borderRadius: 18, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  showCardGradient: { padding: 20 },
  showHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  showEmoji: { fontSize: 38 },
  showBadge: { backgroundColor: 'rgba(199,161,59,0.12)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(199,161,59,0.3)' },
  showBadgeText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  showTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
  showMeta: { fontSize: 13, color: C.textMuted, marginBottom: 4 },
  showFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  showPrice: { fontSize: 26, fontWeight: '800', color: C.gold },
  seatsBadge: { backgroundColor: 'rgba(93,187,109,0.12)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5 },
  showSeats: { fontSize: 12, color: C.green, fontWeight: '700' },
  showActionButtons: { flexDirection: 'row', gap: 12, marginTop: 14 },
  detailsBtn: { flex: 1, backgroundColor: 'rgba(199,161,59,0.1)', borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  detailsBtnText: { color: C.gold, fontSize: 12, fontWeight: '600' },
  theatreBtn: { flex: 1, backgroundColor: C.surface, borderRadius: 12, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  theatreBtnText: { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  
  theatreCard: { borderRadius: 18, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  theatreCardGradient: { padding: 20 },
  theatreCardEmoji: { fontSize: 40, marginBottom: 8 },
  theatreCardName: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  theatreCardLocation: { fontSize: 13, color: C.textMuted, marginBottom: 8 },
  theatreCardShows: { fontSize: 12, color: C.gold, marginBottom: 10 },
  theatreFacilities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  theatreFacilityBadge: { backgroundColor: 'rgba(199,161,59,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, fontSize: 10, color: C.gold, overflow: 'hidden' },
  theatreMore: { fontSize: 10, color: C.textMuted },
  
  theatreHero: { alignItems: 'center', paddingVertical: 30 },
  theatreHeroEmoji: { fontSize: 60, marginBottom: 12 },
  theatreHeroName: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 8 },
  theatreHeroLocation: { fontSize: 14, color: C.textMuted },
  theatreDescription: { fontSize: 14, color: C.textMuted, lineHeight: 20, marginBottom: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { width: 70, fontSize: 13, color: C.gold, fontWeight: '600' },
  infoValue: { flex: 1, fontSize: 13, color: C.text },
  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  facilityBadge: { backgroundColor: 'rgba(199,161,59,0.1)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  facilityBadgeText: { color: C.gold, fontSize: 12 },
  upcomingShowItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  upcomingShowTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  upcomingShowDate: { fontSize: 12, color: C.textMuted, marginTop: 4 },
  upcomingShowPrice: { fontSize: 14, color: C.gold, fontWeight: '700', marginTop: 4 },
  
  showHero: { alignItems: 'center', paddingVertical: 30 },
  showHeroEmoji: { fontSize: 60, marginBottom: 12 },
  showHeroTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  showHeroMeta: { flexDirection: 'row', gap: 16 },
  showHeroGenre: { backgroundColor: 'rgba(199,161,59,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 12, color: C.gold },
  showHeroRating: { fontSize: 12, color: C.gold },
  showDescription: { fontSize: 14, color: C.textMuted, lineHeight: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.gold, marginBottom: 16 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  detailItem: { flex: 1, minWidth: '45%', backgroundColor: C.surface, borderRadius: 12, padding: 12, alignItems: 'center' },
  detailLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '700', color: C.text },
  venueName: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 4 },
  venueLocation: { fontSize: 13, color: C.textMuted, marginBottom: 8 },
  venueLink: { fontSize: 12, color: C.gold, marginTop: 8 },
  
  ratingStars: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  star: { fontSize: 40, color: C.textMuted },
  starActive: { color: C.gold },
  reviewInput: { backgroundColor: C.surface, color: C.text, borderRadius: 14, padding: 14, fontSize: 14, borderWidth: 1, borderColor: C.border, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  reviewItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewUser: { fontSize: 14, fontWeight: '600', color: C.text },
  reviewStars: { flexDirection: 'row' },
  smallStar: { fontSize: 14, color: C.gold },
  reviewComment: { fontSize: 13, color: C.textMuted, marginBottom: 6 },
  reviewDate: { fontSize: 10, color: C.textMuted },
  
  empty: { textAlign: 'center', color: C.textMuted, marginTop: 60, fontSize: 15 },
  
  screenContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  screenBar: { width: width * 0.65, height: 4, borderRadius: 2 },
  screenLabel: { color: C.gold, fontSize: 11, letterSpacing: 4, marginTop: 10, fontWeight: '700' },
  legend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20, paddingHorizontal: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginBottom: 8 },
  legendDot: { width: 14, height: 14, borderRadius: 4, marginRight: 6 },
  legendText: { color: C.textMuted, fontSize: 11, fontWeight: '600' },
  seatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, paddingHorizontal: 10 },
  rowLabel: { color: C.gold, fontSize: 13, width: 28, textAlign: 'center', fontWeight: '800' },
  seat: { width: 34, height: 34, borderRadius: 9, margin: 3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  seatBooked: { opacity: 0.7 },
  seatNum: { fontSize: 11, fontWeight: '700', color: C.text },
  
  bookingBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.card, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.gold },
  bookingSeats: { color: C.textMuted, fontSize: 14 },
  bookingTotal: { color: C.gold, fontWeight: '800', fontSize: 26 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, borderTopWidth: 2, borderTopColor: C.gold },
  modalTitle: { fontSize: 22, fontWeight: '800', color: C.gold, marginBottom: 16, textAlign: 'center' },
  modalShow: { fontSize: 18, color: C.text, textAlign: 'center', marginBottom: 8 },
  modalTotal: { fontSize: 42, fontWeight: '800', color: C.gold, textAlign: 'center', marginVertical: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  modalCancelText: { color: C.textMuted, fontWeight: '700' },
  
  bookingCard: { borderRadius: 18, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  bookingCardGradient: { padding: 20 },
  bookingCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingCardTitle: { fontSize: 18, fontWeight: '800', color: C.gold, flex: 1 },
  statusBadge: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  bookingInfo: { color: C.text, fontSize: 13, marginBottom: 6 },
  cancelBtn: { marginTop: 16, backgroundColor: 'rgba(232,93,93,0.12)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,93,93,0.3)' },
  cancelBtnText: { color: C.red, fontWeight: '700', fontSize: 13 },
  
  tabBar: { flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: 12, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10 },
  tabIcon: { fontSize: 24, color: C.textMuted },
  tabLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600', marginTop: 4 },
  tabActive: { color: C.gold },
});