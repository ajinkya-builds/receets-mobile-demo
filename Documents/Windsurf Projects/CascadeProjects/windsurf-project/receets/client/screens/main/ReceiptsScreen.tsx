import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { 
  Text, 
  Surface, 
  Searchbar, 
  Chip, 
  Divider, 
  Button,
  IconButton
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import axios from 'axios';
import { API_URL } from '../../api/config';
import { useAuth } from '../../context/AuthContext';

type ReceiptsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Receipts'>;

interface Sale {
  _id: string;
  saleNumber: string;
  type: 'purchase' | 'return' | 'exchange';
  status: 'draft' | 'in_progress' | 'completed' | 'voided' | 'refunded' | 'partially_refunded';
  total: number;
  createdAt: string;
  merchantId: {
    _id: string;
    businessName: string;
  };
}

const ReceiptsScreen = () => {
  const navigation = useNavigation<ReceiptsScreenNavigationProp>();
  const { state } = useAuth();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [searchQuery, activeFilter, sales]);

  const fetchSales = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
      } else if (!refresh && !hasMore) {
        return;
      } else {
        setLoading(true);
      }

      const currentPage = refresh ? 1 : page;
      
      const response = await axios.get(`${API_URL}/sales/customer`, {
        params: {
          page: currentPage,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });

      if (response.data.success) {
        const newSales = response.data.sales;
        
        if (refresh) {
          setSales(newSales);
        } else {
          setSales(prevSales => [...prevSales, ...newSales]);
        }
        
        setHasMore(newSales.length === 10);
        if (!refresh) setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];
    
    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(sale => 
        sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.merchantId.businessName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (activeFilter) {
      filtered = filtered.filter(sale => sale.type === activeFilter);
    }
    
    setFilteredSales(filtered);
  };

  const onRefresh = () => {
    fetchSales(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleFilter = (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'voided':
        return '#F44336';
      case 'refunded':
        return '#FF9800';
      case 'partially_refunded':
        return '#FFC107';
      default:
        return '#9E9E9E';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'cart';
      case 'return':
        return 'keyboard-return';
      case 'exchange':
        return 'swap-horizontal';
      default:
        return 'receipt';
    }
  };

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('SaleDetails', { saleId: item._id })}
    >
      <Surface style={styles.saleItem}>
        <View style={styles.saleHeader}>
          <View style={styles.saleNumberContainer}>
            <IconButton
              icon={getTypeIcon(item.type)}
              size={24}
              color={getStatusColor(item.status)}
              style={styles.typeIcon}
            />
            <View>
              <Text style={styles.saleNumber}>{item.saleNumber}</Text>
              <Text style={styles.merchantName}>{item.merchantId.businessName}</Text>
            </View>
          </View>
          <View>
            <Text style={[styles.saleStatus, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
            <Text style={styles.saleDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.saleFooter}>
          <Chip 
            mode="outlined" 
            style={[styles.typeChip, { borderColor: getStatusColor(item.status) }]}
          >
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Chip>
          <Text style={styles.saleTotal}>
            {item.type === 'return' ? '-' : ''}{formatCurrency(Math.abs(item.total))}
          </Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color="#4A6FFF" />
      </View>
    );
  };

  const renderEmptyList = () => {
    if (loading && page === 1) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <IconButton
          icon="receipt-text-outline"
          size={60}
          color="#CCCCCC"
        />
        <Text style={styles.emptyText}>No receipts found</Text>
        <Text style={styles.emptySubtext}>
          {searchQuery || activeFilter
            ? 'Try adjusting your filters'
            : 'Your transaction history will appear here'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.headerContainer}>
        <Text style={styles.headerText}>My Receipts</Text>
        <Searchbar
          placeholder="Search by receipt # or merchant"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filtersContainer}>
          <Chip
            selected={activeFilter === 'purchase'}
            onPress={() => toggleFilter('purchase')}
            style={styles.filterChip}
            selectedColor="#4A6FFF"
          >
            Purchases
          </Chip>
          <Chip
            selected={activeFilter === 'return'}
            onPress={() => toggleFilter('return')}
            style={styles.filterChip}
            selectedColor="#4A6FFF"
          >
            Returns
          </Chip>
          <Chip
            selected={activeFilter === 'exchange'}
            onPress={() => toggleFilter('exchange')}
            style={styles.filterChip}
            selectedColor="#4A6FFF"
          >
            Exchanges
          </Chip>
        </View>
      </Surface>

      <FlatList
        data={filteredSales}
        renderItem={renderSaleItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A6FFF']}
          />
        }
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasMore && !loading && !searchQuery && !activeFilter) {
            fetchSales();
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  saleItem: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  saleNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    margin: 0,
    marginRight: 8,
  },
  saleNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  merchantName: {
    fontSize: 14,
    color: '#666',
  },
  saleStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  saleDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  divider: {
    marginVertical: 12,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    height: 30,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loaderFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ReceiptsScreen;
