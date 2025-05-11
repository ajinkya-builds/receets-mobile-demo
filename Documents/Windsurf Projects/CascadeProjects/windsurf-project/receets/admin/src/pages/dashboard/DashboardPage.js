import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Store,
  AttachMoney,
  ShoppingCart,
  KeyboardReturn
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../api/config';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalReturns: 0,
    salesRevenue: 0,
    returnsAmount: 0,
    netRevenue: 0,
    paymentMethods: {}
  });
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    // In a real app, this would fetch actual data from the API
    // For demo purposes, we'll simulate a loading delay and use mock data
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock analytics data
        setAnalytics({
          totalSales: 128,
          totalReturns: 12,
          salesRevenue: 8745.50,
          returnsAmount: 645.75,
          netRevenue: 8099.75,
          paymentMethods: {
            receets_pay: 4500.25,
            cash: 2100.50,
            card: 2145.75
          }
        });
        
        // Mock recent sales data
        setRecentSales([
          {
            _id: '1',
            saleNumber: 'SALE-1683921456-123',
            type: 'purchase',
            status: 'completed',
            total: 125.50,
            createdAt: '2025-05-11T10:30:00',
            customer: {
              firstName: 'John',
              lastName: 'Doe'
            }
          },
          {
            _id: '2',
            saleNumber: 'SALE-1683921789-456',
            type: 'purchase',
            status: 'completed',
            total: 78.25,
            createdAt: '2025-05-11T11:15:00',
            customer: {
              firstName: 'Jane',
              lastName: 'Smith'
            }
          },
          {
            _id: '3',
            saleNumber: 'RET-1683922012-789',
            type: 'return',
            status: 'completed',
            total: -45.99,
            createdAt: '2025-05-11T12:45:00',
            customer: {
              firstName: 'Michael',
              lastName: 'Johnson'
            }
          },
          {
            _id: '4',
            saleNumber: 'SALE-1683922345-012',
            type: 'purchase',
            status: 'completed',
            total: 210.75,
            createdAt: '2025-05-11T14:20:00',
            customer: {
              firstName: 'Sarah',
              lastName: 'Williams'
            }
          },
          {
            _id: '5',
            saleNumber: 'SALE-1683922678-345',
            type: 'purchase',
            status: 'in_progress',
            total: 56.80,
            createdAt: '2025-05-11T15:10:00',
            customer: {
              firstName: 'David',
              lastName: 'Brown'
            }
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sales data for line chart
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Sales Revenue',
        data: [4500, 5200, 4800, 5800, 6200, 7500, 8200, 7800, 8500, 9200, 8800, 8745.50],
        borderColor: '#4A6FFF',
        backgroundColor: 'rgba(74, 111, 255, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Returns',
        data: [320, 450, 380, 520, 480, 620, 580, 650, 600, 700, 680, 645.75],
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Payment methods data for bar chart
  const paymentData = {
    labels: ['Receets Pay', 'Cash', 'Card'],
    datasets: [
      {
        label: 'Payment Methods',
        data: [4500.25, 2100.50, 2145.75],
        backgroundColor: [
          'rgba(74, 111, 255, 0.7)',
          'rgba(76, 175, 80, 0.7)',
          'rgba(255, 193, 7, 0.7)'
        ],
        borderColor: [
          'rgba(74, 111, 255, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(255, 193, 7, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {currentUser?.businessName || 'Merchant'}! Here's your business overview.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              bgcolor: 'rgba(74, 111, 255, 0.1)',
              borderLeft: '4px solid #4A6FFF'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Sales
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {analytics.totalSales}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="body2" color="success.main">
                +12% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              borderLeft: '4px solid #4CAF50'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Revenue
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {formatCurrency(analytics.netRevenue)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="body2" color="success.main">
                +8.5% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              bgcolor: 'rgba(255, 193, 7, 0.1)',
              borderLeft: '4px solid #FFC107'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Returns
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {analytics.totalReturns}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              <TrendingDown sx={{ color: 'warning.main', mr: 1 }} />
              <Typography variant="body2" color="warning.main">
                {formatCurrency(analytics.returnsAmount)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderRadius: 2,
              bgcolor: 'rgba(255, 107, 107, 0.1)',
              borderLeft: '4px solid #FF6B6B'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Return Rate
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {((analytics.totalReturns / (analytics.totalSales + analytics.totalReturns)) * 100).toFixed(1)}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              <TrendingDown sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="body2" color="success.main">
                -2.3% from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sales Overview
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: 300 }}>
              <Line
                data={salesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(context.parsed.y);
                          }
                          return label;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payment Methods
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: 300 }}>
              <Bar
                data={paymentData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(context.parsed.y);
                          }
                          return label;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Sales */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {recentSales.map((sale) => (
                <React.Fragment key={sale._id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      borderLeft: sale.type === 'return' 
                        ? '4px solid #FF6B6B' 
                        : '4px solid #4CAF50',
                      pl: 2,
                      py: 1.5,
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: sale.type === 'return' ? '#FF6B6B' : '#4CAF50' }}>
                        {sale.type === 'return' ? <KeyboardReturn /> : <ShoppingCart />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {sale.saleNumber}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {sale.type === 'return' ? '-' : ''}{formatCurrency(Math.abs(sale.total))}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {sale.customer.firstName} {sale.customer.lastName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label={sale.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                mr: 1,
                                bgcolor: sale.status === 'completed' 
                                  ? 'rgba(76, 175, 80, 0.1)' 
                                  : 'rgba(255, 193, 7, 0.1)',
                                color: sale.status === 'completed' ? '#4CAF50' : '#FFC107',
                                fontWeight: 'bold',
                                textTransform: 'capitalize'
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(sale.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {sale !== recentSales[recentSales.length - 1] && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
