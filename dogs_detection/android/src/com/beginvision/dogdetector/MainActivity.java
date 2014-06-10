package com.beginvision.dogdetector;

import java.util.concurrent.locks.ReentrantLock;
import org.apache.http.conn.util.InetAddressUtils;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Camera;
import android.hardware.Camera.PreviewCallback;
import android.hardware.Camera.PictureCallback;
import android.graphics.Bitmap;
import android.media.AudioFormat;
import android.media.MediaRecorder;
import android.media.AudioRecord;
import android.os.Bundle;
import android.os.Looper;
import android.os.Handler;
import java.io.*;
import android.util.*;
import android.view.SurfaceView;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

public class MainActivity extends Activity
        implements CameraView.CameraReadyCallback, OverlayView.UpdateDoneCallback
{
    public static String TAG="BV";
    
    private ReentrantLock previewLock = new ReentrantLock();
    private CameraView cameraView = null;
    private OverlayView overlayView = null;
    private Bitmap  resultBitmap = null;  
    
    private int     lastReturn = -1;
    private boolean drawResult = false;

    //
    //  Activiity's event handler
    //
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // application setting
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        Window win = getWindow();
        win.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);    

        // load and setup GUI
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        TextView tv = (TextView)findViewById(R.id.tv_message);
        tv.setText("将白框对准狗狗的脸");
        
        // init NativeAgent
        NativeAgent.init();

        // init camera
        initCamera();
   }
    @Override
    public void onDestroy() {
        super.onDestroy();
    }

    @Override
    public void onPause() {      
        super.onPause();

        if ( cameraView != null) {
            previewLock.lock();
            cameraView.StopPreview();
            previewLock.unlock();
        }

        //finish();
        System.exit(0);
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
    }

    //
    //  Interface implementation
    //
    public void onCameraReady() {
        cameraView.StopPreview();
        cameraView.setupCamera(640, 480, 4, previewCb);
        resultBitmap = Bitmap.createBitmap(cameraView.Width(), cameraView.Height(), Bitmap.Config.ARGB_8888);
        cameraView.StartPreview();
    }

    public void onUpdateDone() {
         
    }

    //
    //  Internal help functions
    //
    private void initCamera() {
        SurfaceView cameraSurface = (SurfaceView)findViewById(R.id.surface_camera);
        cameraView = new CameraView(cameraSurface);        
        cameraView.setCameraReadyCallback(this);

        overlayView = (OverlayView)findViewById(R.id.surface_overlay);
        //overlayView_.setOnTouchListener(this);
        overlayView.setUpdateDoneCallback(this);
    }
     
    //
    //  Internal help class and object definment
    //
    private PreviewCallback previewCb = new PreviewCallback() {
        public void onPreviewFrame(byte[] yuvFrame, Camera c) {
            processNewFrame(yuvFrame, c);
        }
    };

    private void processNewFrame(final byte[] yuvFrame, final Camera c) {
        if ( previewLock.isLocked() ) {
            c.addCallbackBuffer(yuvFrame);
            return;
        }
        
        new Thread(new Runnable() {
                    public void run() {
                        previewLock.lock(); 
                        int ret = NativeAgent.updatePictureForResult(yuvFrame, resultBitmap, cameraView.Width(), cameraView.Height());
                        c.addCallbackBuffer(yuvFrame);
                        if ( lastReturn != ret ) {
                            lastReturn = ret;
                            drawResult = true;
                        } else {
                            drawResult = false;
                        }
                        previewLock.unlock();
                        new Handler(Looper.getMainLooper()).post( resultAction );
                    }
                }).start();
    }

    private Runnable resultAction = new Runnable() {
        @Override 
        public void run() {
            if ( drawResult ) {
                overlayView.DrawResult(resultBitmap);
            }
        }
    };
}
